import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, StaffStatus, User, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ensureDefaultAccessControl } from '../common/access-control/default-access-control';
import { sanitizeUser } from '../common/utils/user.util';
import { AuthUser } from '../common/types/auth-user.type';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { MailService } from './mail.service';

type OtpPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.role && dto.role !== UserRole.OWNER) {
      throw new BadRequestException('Only owner registration is public');
    }
    if (dto.confirmPassword && dto.confirmPassword !== dto.password) {
      throw new BadRequestException('Password confirmation does not match');
    }
    const permissions = await ensureDefaultAccessControl(this.prisma);
    const email = this.normalizeEmail(dto.email);
    const existingResponse = await this.handleExistingRegistration(dto, email);

    if (existingResponse) {
      return existingResponse;
    }

    const { confirmPassword, ...data } = dto;
    void confirmPassword;
    const user = await this.prisma.user.create({
      data: {
        ...data,
        email,
        role: UserRole.OWNER,
        status: UserStatus.PENDING,
        isActive: false,
        password: await bcrypt.hash(dto.password, 10),
        userPermissions: {
          create: permissions.map((permission) => ({ permissionId: permission.id })),
        },
      },
      include: this.authUserInclude,
    });
    await this.createAndSendOtp(user, 'EMAIL_VERIFICATION');
    return {
      token: null,
      user: sanitizeUser(user),
      message:
        'Owner account created. Verify your email with the OTP we sent, then wait for super admin approval.',
      nextStep: 'VERIFY_EMAIL',
    };
  }

  async login(dto: LoginDto) {
    if (!dto.phone && !dto.email)
      throw new BadRequestException('Phone or email is required');
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { phone: dto.phone || undefined },
          { email: dto.email || undefined },
        ],
      },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.email && !user.emailVerifiedAt) {
      throw new ForbiddenException('Please verify your email before login.');
    }
    if (user.status === UserStatus.PENDING) {
      throw new ForbiddenException(
        'Your account is pending super admin approval.',
      );
    }
    if (!user.isActive || user.status === UserStatus.BLOCKED) {
      throw new ForbiddenException(
        'Your account is inactive. Contact super admin.',
      );
    }
    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
      this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          module: 'AUTH',
          recordId: String(user.id),
        },
      }),
    ]);
    return this.authResponse(updatedUser);
  }

  async refreshToken(dto: RefreshTokenDto) {
    const userId = this.refreshTokenUserId(dto.refreshToken);
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
        isActive: true,
        status: UserStatus.ACTIVE,
        refreshTokenHash: { not: null },
        refreshTokenExpiresAt: { gt: new Date() },
      },
    });

    if (
      !user?.refreshTokenHash ||
      !(await bcrypt.compare(dto.refreshToken, user.refreshTokenHash))
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.authResponse(user);
  }

  async profile(user: AuthUser) {
    const found = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: this.authUserInclude,
    });
    if (!found) throw new NotFoundException('User not found');
    return sanitizeUser(found);
  }

  async changePassword(user: AuthUser, dto: ChangePasswordDto) {
    const found = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    if (!(await bcrypt.compare(dto.currentPassword, found.password))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(dto.newPassword, 10),
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
        tokenVersion: { increment: 1 },
      },
    });
    return { message: 'Password changed successfully' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.findUserByEmail(dto.email);

    if (!user) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (user.emailVerifiedAt) {
      return { message: 'Email is already verified' };
    }

    await this.verifyOtp(user.id, dto.email, dto.otp, 'EMAIL_VERIFICATION');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });

    return {
      message:
        'Email verified successfully. Your account still needs super admin approval before login.',
    };
  }

  async resendEmailVerification(dto: RequestPasswordResetDto) {
    const user = await this.findUserByEmail(dto.email);

    if (user && !user.emailVerifiedAt) {
      await this.createAndSendOtp(user, 'EMAIL_VERIFICATION');
    }

    return {
      message:
        'If this email needs verification, a new OTP has been sent.',
    };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.findUserByEmail(dto.email);

    if (user) {
      await this.createAndSendOtp(user, 'PASSWORD_RESET');
    }

    return {
      message:
        'If this email is registered, a password reset OTP has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.confirmPassword && dto.confirmPassword !== dto.newPassword) {
      throw new BadRequestException('Password confirmation does not match');
    }

    const user = await this.findUserByEmail(dto.email);

    if (!user) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.verifyOtp(user.id, dto.email, dto.otp, 'PASSWORD_RESET');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(dto.newPassword, 10),
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
        tokenVersion: { increment: 1 },
      },
    });

    return { message: 'Password reset successfully' };
  }

  async updateProfile(
    user: AuthUser,
    dto: { name?: string; email?: string; phone?: string },
  ) {
    if (dto.phone || dto.email) {
      await this.ensureProfileUnique(user.id, dto);
    }
    const found = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    const nextEmail = dto.email ? this.normalizeEmail(dto.email) : undefined;
    const emailChanged = !!nextEmail && nextEmail !== found.email;
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...dto,
        email: nextEmail,
        ...(emailChanged ? { emailVerifiedAt: null } : {}),
      },
      include: this.authUserInclude,
    });
    if (emailChanged) {
      await this.createAndSendOtp(updated, 'EMAIL_VERIFICATION');
    }
    return sanitizeUser(updated);
  }

  async logout(user: AuthUser) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
        tokenVersion: { increment: 1 },
      },
    });
    return { message: 'Logged out successfully' };
  }

  private async handleExistingRegistration(dto: RegisterDto, email: string) {
    const [emailUser, phoneUser] = await Promise.all([
      this.prisma.user.findFirst({
        where: { email, deletedAt: null },
      }),
      this.prisma.user.findFirst({
        where: { phone: dto.phone, deletedAt: null },
      }),
    ]);

    if (emailUser) {
      if (phoneUser && phoneUser.id !== emailUser.id) {
        throw new ConflictException(
          'This phone number is already registered with another account.',
        );
      }

      if (!emailUser.emailVerifiedAt) {
        const updatedUser = await this.prisma.user.update({
          where: { id: emailUser.id },
          data: {
            name: dto.name,
            phone: dto.phone,
            password: await bcrypt.hash(dto.password, 10),
            role: UserRole.OWNER,
            status: UserStatus.PENDING,
            isActive: false,
            refreshTokenHash: null,
            refreshTokenExpiresAt: null,
            tokenVersion: { increment: 1 },
          },
          include: this.authUserInclude,
        });

        await this.createAndSendOtp(updatedUser, 'EMAIL_VERIFICATION');

        return {
          token: null,
          user: sanitizeUser(updatedUser),
          message:
            'This email was already registered but not verified. We sent a new OTP to continue signup.',
          nextStep: 'VERIFY_EMAIL',
        };
      }

      if (emailUser.status === UserStatus.PENDING) {
        throw new ConflictException(
          'This email is already verified and waiting for super admin approval.',
        );
      }

      throw new ConflictException(
        'An account with this email already exists. Please sign in or reset your password.',
      );
    }

    if (phoneUser) {
      throw new ConflictException(
        'This phone number is already registered. Please sign in with the original account or use another phone number.',
      );
    }

    return null;
  }

  private async ensureProfileUnique(
    userId: number,
    dto: { email?: string; phone?: string },
  ) {
    const exists = await this.prisma.user.findFirst({
      where: {
        id: { not: userId },
        deletedAt: null,
        OR: [
          ...(dto.phone ? [{ phone: dto.phone }] : []),
          ...(dto.email ? [{ email: this.normalizeEmail(dto.email) }] : []),
        ],
      },
    });

    if (exists) {
      throw new ConflictException('Phone or email already exists');
    }
  }

  private async authResponse(user: User) {
    await ensureDefaultAccessControl(this.prisma);
    const refreshToken = this.createRefreshToken(user.id);
    const refreshTokenExpiresAt = this.refreshTokenExpiry();
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: await bcrypt.hash(refreshToken, 10),
        refreshTokenExpiresAt,
      },
      include: this.authUserInclude,
    });
    const accessToken = this.jwt.sign(this.jwtPayload(updatedUser), {
      expiresIn:
        this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ||
        '15m',
    });

    return {
      accessToken,
      refreshToken,
      token: accessToken,
      user: sanitizeUser(updatedUser),
    };
  }

  private readonly authUserInclude = {
    userPermissions: { include: { permission: true } },
    staff: {
      where: { status: StaffStatus.ACTIVE },
      include: {
        staffPermissions: { include: { permission: true } },
        role: { include: { rolePermissions: { include: { permission: true } } } },
      },
    },
  } satisfies Prisma.UserInclude;

  private jwtPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      role: user.role,
      status: user.status,
      isActive: user.isActive,
      tokenVersion: user.tokenVersion,
    };
  }

  private createRefreshToken(userId: number): string {
    return `${userId}.${randomBytes(48).toString('base64url')}`;
  }

  private refreshTokenUserId(refreshToken: string): number {
    const [userId] = refreshToken.split('.');
    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return parsedUserId;
  }

  private refreshTokenExpiry(): Date {
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email: this.normalizeEmail(email),
        deletedAt: null,
      },
    });
  }

  private async createAndSendOtp(user: User, purpose: OtpPurpose) {
    if (!user.email) {
      throw new BadRequestException('Email is required for OTP verification');
    }

    const otp = this.generateOtp();
    const now = new Date();
    const expiresAt = this.otpExpiry();

    await this.prisma.$transaction([
      this.prisma.emailOtp.updateMany({
        where: {
          userId: user.id,
          purpose,
          consumedAt: null,
        },
        data: { consumedAt: now },
      }),
      this.prisma.emailOtp.create({
        data: {
          userId: user.id,
          email: user.email,
          purpose,
          codeHash: await bcrypt.hash(otp, 10),
          expiresAt,
        },
      }),
    ]);

    await this.mail.sendOtp(user.email, otp, purpose);
  }

  private async verifyOtp(
    userId: number,
    email: string,
    otp: string,
    purpose: OtpPurpose,
  ) {
    const record = await this.prisma.emailOtp.findFirst({
      where: {
        userId,
        email: this.normalizeEmail(email),
        purpose,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.expiresAt <= new Date() || record.attempts >= 5) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const isValid = await bcrypt.compare(otp, record.codeHash);

    if (!isValid) {
      await this.prisma.emailOtp.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.prisma.emailOtp.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
  }

  private generateOtp(): string {
    return String(randomInt(100000, 1000000));
  }

  private otpExpiry(): Date {
    const minutes = Number(this.config.get<string>('OTP_EXPIRES_MINUTES') || 10);
    return new Date(Date.now() + minutes * 60 * 1000);
  }
}
