import { Injectable, NotFoundException } from '@nestjs/common';
import { ImeiEventType, Prisma } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { paginated, pagination } from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarrantyClaimDto } from './dto/create-warranty-claim.dto';
import { CreateWarrantyDto } from './dto/create-warranty.dto';

@Injectable()
export class WarrantiesService {
  constructor(private readonly prisma: PrismaService, private readonly ownership: OwnershipService) {}

  async create(user: AuthUser, dto: CreateWarrantyDto) {
    await this.ownership.ensureShopAccess(Number(dto.shopId), user);
    const product = await this.prisma.product.findFirst({ where: { id: Number(dto.productId), shopId: Number(dto.shopId), deletedAt: null } });
    if (!product) throw new NotFoundException('Product not found');
    const startDate = new Date(dto.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + Number(dto.warrantyMonths));
    return this.prisma.warranty.create({
      data: { ...dto, startDate, endDate, createdById: user.id },
      include: { product: true, customer: true, sale: true },
    });
  }

  async list(user: AuthUser, query: PaginationDto & { shop_id?: string; status?: string }) {
    const shopId = Number(query.shop_id);
    await this.ownership.ensureShopAccess(shopId, user);
    const { page, limit, skip, take } = pagination(query);
    const where: Prisma.WarrantyWhereInput = { shopId, ...(query.status ? { status: query.status as never } : {}) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.warranty.findMany({ where, skip, take, include: { product: true, customer: true }, orderBy: { [query.sortBy || 'endDate']: query.sortOrder } }),
      this.prisma.warranty.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async findOne(id: number, user: AuthUser) {
    const warranty = await this.prisma.warranty.findUnique({ where: { id }, include: { product: true, customer: true, sale: true, claims: true } });
    if (!warranty) throw new NotFoundException('Warranty not found');
    await this.ownership.ensureShopAccess(warranty.shopId, user);
    return warranty;
  }

  async claim(id: number, user: AuthUser, dto: CreateWarrantyClaimDto) {
    const warranty = await this.findOne(id, user);
    const claim = await this.prisma.warrantyClaim.create({
      data: {
        shopId: warranty.shopId,
        warrantyId: warranty.id,
        productId: warranty.productId,
        customerId: warranty.customerId,
        issueDescription: dto.issueDescription,
        resolution: dto.resolution,
        notes: dto.notes,
        status: dto.status,
        createdById: user.id,
      },
      include: { warranty: true, product: true, customer: true },
    });
    const imei = warranty.product.imei1 || warranty.product.serialNumber;
    if (imei) {
      await this.prisma.imeiHistory.create({
        data: {
          shopId: warranty.shopId,
          productId: warranty.productId,
          imei,
          serialNumber: warranty.product.serialNumber,
          eventType: ImeiEventType.WARRANTY_CLAIM,
          referenceType: 'WARRANTY_CLAIM',
          referenceId: String(claim.id),
          createdById: user.id,
        },
      });
    }
    return claim;
  }

  async history(id: number, user: AuthUser) {
    const warranty = await this.findOne(id, user);
    return warranty.claims;
  }
}
