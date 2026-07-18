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
import { User, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { sanitizeUser } from '../common/utils/user.util';
import { AuthUser } from '../common/types/auth-user.type';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.role && dto.role !== UserRole.OWNER) {
      throw new BadRequestException('Only owner registration is public');
    }
    if (dto.confirmPassword && dto.confirmPassword !== dto.password) {
      throw new BadRequestException('Password confirmation does not match');
    }
    await this.ensureUnique(dto.phone, dto.email);
    const { confirmPassword, ...data } = dto;
    void confirmPassword;
    const user = await this.prisma.user.create({
      data: {
        ...data,
        role: UserRole.OWNER,
        status: UserStatus.PENDING,
        isActive: false,
        password: await bcrypt.hash(dto.password, 10),
      },
    });
    return {
      token: null,
      user: sanitizeUser(user),
      message:
        'Owner account created. Your account is pending super admin approval.',
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
    const found = await this.prisma.user.findUnique({ where: { id: user.id } });
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

  async updateProfile(
    user: AuthUser,
    dto: { name?: string; email?: string; phone?: string },
  ) {
    if (dto.phone || dto.email) {
      const exists = await this.prisma.user.findFirst({
        where: {
          id: { not: user.id },
          deletedAt: null,
          OR: [
            ...(dto.phone ? [{ phone: dto.phone }] : []),
            ...(dto.email ? [{ email: dto.email }] : []),
          ],
        },
      });
      if (exists) throw new ConflictException('Phone or email already exists');
    }
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: dto,
    });
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

  private async ensureUnique(phone: string, email?: string) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
    });
    if (exists) throw new ConflictException('Phone or email already exists');
  }

  private async authResponse(user: User) {
    const refreshToken = this.createRefreshToken(user.id);
    const refreshTokenExpiresAt = this.refreshTokenExpiry();
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: await bcrypt.hash(refreshToken, 10),
        refreshTokenExpiresAt,
      },
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
}
