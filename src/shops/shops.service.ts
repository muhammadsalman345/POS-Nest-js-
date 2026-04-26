import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { serializeAuditData } from '../common/utils/audit.util';
import { paginated, pagination } from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class ShopsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  async create(user: AuthUser, dto: CreateShopDto) {
    const shop = await this.prisma.shop.create({ data: { ...dto, ownerId: user.id } });
    await this.audit(user.id, 'CREATE', shop.id, null, shop);
    return shop;
  }

  async my(user: AuthUser, query: PaginationDto) {
    return this.list(query, { ownerId: user.id });
  }

  async findAll(user: AuthUser, query: PaginationDto) {
    return this.list(query, user.role === UserRole.ADMIN ? {} : { ownerId: user.id });
  }

  async findOne(id: number, user: AuthUser) {
    return this.ownership.ensureShopAccess(id, user);
  }

  async update(id: number, user: AuthUser, dto: UpdateShopDto) {
    const old = await this.ownership.ensureShopAccess(id, user);
    const shop = await this.prisma.shop.update({ where: { id }, data: dto });
    await this.audit(user.id, 'UPDATE', id, old, shop);
    return shop;
  }

  async remove(id: number, user: AuthUser) {
    const old = await this.ownership.ensureShopAccess(id, user);
    await this.prisma.shop.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    await this.audit(user.id, 'DELETE', id, old, null);
    return { message: 'Shop deleted' };
  }

  private async list(query: PaginationDto, extra: Record<string, unknown>) {
    const { page, limit, skip, take } = pagination(query);
    const where = {
      ...extra,
      deletedAt: null,
      ...(query.search ? { OR: [{ name: { contains: query.search } }, { city: { contains: query.search } }] } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.shop.findMany({ where, skip, take, orderBy: { [query.sortBy || 'createdAt']: query.sortOrder } }),
      this.prisma.shop.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  private audit(userId: number, action: string, recordId: number, oldData: unknown, newData: unknown) {
    return this.prisma.auditLog.create({
      data: { userId, action, module: 'SHOP', recordId: String(recordId), oldData: serializeAuditData(oldData), newData: serializeAuditData(newData) },
    });
  }
}
