import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuthUser } from '../common/types/auth-user.type';
import { paginated, pagination } from '../common/utils/pagination.util';
import { sanitizeUser } from '../common/utils/user.util';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationDto) {
    const { page, limit, skip, take } = pagination(query);
    const where = {
      deletedAt: null,
      ...(query.search
        ? { OR: [{ name: { contains: query.search } }, { phone: { contains: query.search } }, { email: { contains: query.search } }] }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, skip, take, orderBy: { [query.sortBy || 'createdAt']: query.sortOrder } }),
      this.prisma.user.count({ where }),
    ]);
    return paginated(items.map(sanitizeUser), total, page, limit);
  }

  async findOne(id: number, current: AuthUser) {
    if (current.role !== UserRole.ADMIN && current.id !== id) throw new ForbiddenException();
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');
    return sanitizeUser(user);
  }

  async update(id: number, current: AuthUser, dto: UpdateUserDto) {
    if (current.role !== UserRole.ADMIN && current.id !== id) throw new ForbiddenException();
    const user = await this.prisma.user.update({ where: { id }, data: dto });
    return sanitizeUser(user);
  }

  async remove(id: number) {
    await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    return { message: 'User deleted' };
  }

  async status(id: number, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.update({ where: { id }, data: { isActive: dto.isActive } });
    return sanitizeUser(user);
  }
}
