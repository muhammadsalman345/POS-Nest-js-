import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { serializeAuditData } from '../common/utils/audit.util';
import { paginated, pagination } from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';

@Injectable()
export class SellersService {
  constructor(private readonly prisma: PrismaService, private readonly ownership: OwnershipService) {}

  async create(shopId: number, user: AuthUser, dto: CreateSellerDto) {
    await this.ownership.ensureShopAccess(shopId, user);
    const seller = await this.prisma.seller.create({ data: { ...dto, shopId } });
    await this.audit(user.id, 'CREATE', seller.id, null, seller);
    return seller;
  }

  async list(shopId: number, user: AuthUser, query: PaginationDto) {
    await this.ownership.ensureShopAccess(shopId, user);
    const { page, limit, skip, take } = pagination(query);
    const where = { shopId, deletedAt: null, ...(query.search ? { OR: [{ name: { contains: query.search } }, { cnic: { contains: query.search } }, { phone: { contains: query.search } }] } : {}) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.seller.findMany({ where, skip, take, orderBy: { [query.sortBy || 'createdAt']: query.sortOrder } }),
      this.prisma.seller.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async findOne(id: number, user: AuthUser) {
    const seller = await this.prisma.seller.findFirst({ where: { id, deletedAt: null } });
    if (!seller) throw new NotFoundException('Seller not found');
    await this.ownership.ensureShopAccess(seller.shopId, user);
    return seller;
  }

  async update(id: number, user: AuthUser, dto: UpdateSellerDto) {
    const old = await this.findOne(id, user);
    const seller = await this.prisma.seller.update({ where: { id }, data: dto });
    await this.audit(user.id, 'UPDATE', id, old, seller);
    return seller;
  }

  async remove(id: number, user: AuthUser) {
    const old = await this.findOne(id, user);
    await this.prisma.seller.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit(user.id, 'DELETE', id, old, null);
    return { message: 'Seller deleted' };
  }

  async purchases(id: number, user: AuthUser) {
    const seller = await this.findOne(id, user);
    return this.prisma.purchase.findMany({ where: { sellerId: seller.id, deletedAt: null }, include: { product: true } });
  }

  private audit(userId: number, action: string, recordId: number, oldData: unknown, newData: unknown) {
    return this.prisma.auditLog.create({
      data: { userId, action, module: 'SELLER', recordId: String(recordId), oldData: serializeAuditData(oldData), newData: serializeAuditData(newData) },
    });
  }
}
