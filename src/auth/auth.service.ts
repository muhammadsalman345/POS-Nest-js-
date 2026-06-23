import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
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
    if (dto.role === UserRole.SUPER_ADMIN) throw new BadRequestException('Super admin registration is not public');
    if (dto.confirmPassword && dto.confirmPassword !== dto.password) {
      throw new BadRequestException('Password confirmation does not match');
    }
    await this.ensureUnique(dto.phone, dto.email);
    const { confirmPassword, ...data } = dto;
    void confirmPassword;
    const user = await this.prisma.user.create({
      data: { ...data, password: await bcrypt.hash(dto.password, 10) },
    });
    return this.authResponse(user);
  }

  async login(dto: LoginDto) {
    if (!dto.phone && !dto.email) throw new BadRequestException('Phone or email is required');
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ phone: dto.phone || undefined }, { email: dto.email || undefined }],
      },
    });
    if (!user || !user.isActive || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    await this.prisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN', module: 'AUTH', recordId: String(user.id) },
    });
    return this.authResponse(user);
  }

  async profile(user: AuthUser) {
    const found = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!found) throw new NotFoundException('User not found');
    return sanitizeUser(found);
  }

  async changePassword(user: AuthUser, dto: ChangePasswordDto) {
    const found = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!(await bcrypt.compare(dto.currentPassword, found.password))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(dto.newPassword, 10) },
    });
    return { message: 'Password changed successfully' };
  }

  private async ensureUnique(phone: string, email?: string) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
    });
    if (exists) throw new ConflictException('Phone or email already exists');
  }

  private authResponse(user: { id: number; phone: string; email: string | null; role: UserRole; password?: string }) {
    return {
      token: this.jwt.sign(
        { sub: user.id, role: user.role },
        { expiresIn: this.config.get<string>('JWT_EXPIRES_IN') || '7d' },
      ),
      user: sanitizeUser(user),
    };
  }
}
