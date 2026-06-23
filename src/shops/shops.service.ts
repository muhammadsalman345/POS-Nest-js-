import { Injectable, NotFoundException } from '@nestjs/common';
import { ShopApprovalStatus, UserRole } from '@prisma/client';
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
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
    const shop = await this.prisma.shop.create({
      data: {
        ...dto,
        ownerId: user.id,
        isActive: isSuperAdmin,
        approvalStatus: isSuperAdmin ? ShopApprovalStatus.APPROVED : ShopApprovalStatus.PENDING,
        approvedAt: isSuperAdmin ? new Date() : undefined,
        approvedById: isSuperAdmin ? user.id : undefined,
      },
    });
    await this.audit(user.id, 'CREATE', shop.id, null, shop);
    return shop;
  }

  async my(user: AuthUser, query: PaginationDto) {
    return this.list(query, { ownerId: user.id });
  }

  async findAll(user: AuthUser, query: PaginationDto) {
    return this.list(query, user.role === UserRole.SUPER_ADMIN ? {} : { ownerId: user.id });
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

  async review(id: number, user: AuthUser, dto: { approvalStatus: ShopApprovalStatus; paymentRequired?: boolean; paymentAmount?: number; rejectionReason?: string }) {
    const old = await this.ownership.ensureShopAccess(id, user);
    const isApproved = dto.approvalStatus === ShopApprovalStatus.APPROVED;
    const shop = await this.prisma.shop.update({
      where: { id },
      data: {
        approvalStatus: dto.approvalStatus,
        paymentRequired: dto.paymentRequired ?? dto.approvalStatus === ShopApprovalStatus.PAYMENT_REQUIRED,
        paymentAmount: dto.paymentAmount,
        rejectionReason: dto.rejectionReason,
        isActive: isApproved,
        approvedAt: isApproved ? new Date() : null,
        approvedById: isApproved ? user.id : null,
      },
      include: { owner: { select: { id: true, name: true, phone: true, email: true, role: true } } },
    });
    await this.audit(user.id, 'REVIEW', id, old, shop);
    return shop;
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
