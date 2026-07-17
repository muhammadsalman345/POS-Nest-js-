import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { AuthUser } from '../common/types/auth-user.type';
import { paginated, pagination } from '../common/utils/pagination.util';
import { sanitizeUser } from '../common/utils/user.util';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private isAdmin(user: AuthUser) {
    return user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;
  }

  async findAll(current: AuthUser, query: UserQueryDto) {
    const { page, limit, skip, take } = pagination(query);
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search } },
              { phone: { contains: query.search } },
              { email: { contains: query.search } },
            ],
          }
        : {}),
    };

    if (!this.isAdmin(current)) {
      const ownerShopIds = await this.prisma.shop.findMany({
        where: { ownerId: current.id, deletedAt: null },
        select: { id: true },
      });
      const shopIds = ownerShopIds.map((shop) => shop.id);

      where.role = UserRole.STAFF;
      where.staff = shopIds.length
        ? { some: { shopId: { in: shopIds } } }
        : { some: { shopId: -1 } };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginated(items.map(sanitizeUser), total, page, limit);
  }

  async findOne(id: number, current: AuthUser) {
    if (!this.isAdmin(current) && current.id !== id)
      throw new ForbiddenException();
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');
    return sanitizeUser(user);
  }

  async update(id: number, current: AuthUser, dto: UpdateUserDto) {
    if (!this.isAdmin(current) && current.id !== id)
      throw new ForbiddenException();
    const user = await this.prisma.user.update({ where: { id }, data: dto });
    return sanitizeUser(user);
  }

  async remove(id: number) {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { message: 'User deleted' };
  }

  async status(id: number, current: AuthUser, dto: UpdateUserStatusDto) {
    if (current.id === id)
      throw new BadRequestException(
        'You cannot change your own account status',
      );
    const existing = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('User not found');
    if (existing.role === UserRole.SUPER_ADMIN)
      throw new BadRequestException('Super admin status cannot be changed');
    if (!dto.status && typeof dto.isActive !== 'boolean') {
      throw new BadRequestException('Account status is required');
    }

    const status =
      dto.status ?? (dto.isActive ? UserStatus.ACTIVE : UserStatus.BLOCKED);

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: status === UserStatus.ACTIVE, status },
    });
    return sanitizeUser(user);
  }
}
