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
import { PrismaService } from '../prisma/prisma.service';
import { sanitizeUser } from '../common/utils/user.util';
import { AuthUser } from '../common/types/auth-user.type';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

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
    await this.prisma.$transaction([
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
      data: { password: await bcrypt.hash(dto.newPassword, 10) },
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

  logout(user: AuthUser) {
    void user;
    return { message: 'Logged out successfully' };
  }

  private async ensureUnique(phone: string, email?: string) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
    });
    if (exists) throw new ConflictException('Phone or email already exists');
  }

  private authResponse(user: User) {
    return {
      token: this.jwt.sign(
        { sub: user.id, role: user.role },
        { expiresIn: this.config.get<string>('JWT_EXPIRES_IN') || '7d' },
      ),
      user: sanitizeUser(user),
    };
  }
}
