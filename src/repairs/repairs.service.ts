import { Injectable, NotFoundException } from '@nestjs/common';
import { ImeiEventType, Prisma, RepairStatus } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { paginated, pagination } from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRepairDto } from './dto/create-repair.dto';
import { RepairImageDto } from './dto/repair-image.dto';
import { UpdateRepairStatusDto } from './dto/update-repair-status.dto';
import { UpdateRepairDto } from './dto/update-repair.dto';

@Injectable()
export class RepairsService {
  constructor(private readonly prisma: PrismaService, private readonly ownership: OwnershipService) {}

  async create(user: AuthUser, dto: CreateRepairDto) {
    await this.ownership.ensureShopAccess(Number(dto.shopId), user);
    const repair = await this.prisma.repair.create({
      data: {
        ...dto,
        ticketNo: dto.ticketNo || `REP-${dto.shopId}-${Date.now()}`,
        expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
        createdById: user.id,
      },
      include: { customer: true, product: true, images: true },
    });
    await this.recordImei(repair, ImeiEventType.REPAIR_IN, user.id);
    return repair;
  }

  async list(user: AuthUser, query: PaginationDto & { shop_id?: string; status?: string }) {
    const shopId = Number(query.shop_id);
    await this.ownership.ensureShopAccess(shopId, user);
    const { page, limit, skip, take } = pagination(query);
    const where: Prisma.RepairWhereInput = { shopId, deletedAt: null, ...(query.status ? { status: query.status as never } : {}) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.repair.findMany({ where, skip, take, include: { customer: true, product: true }, orderBy: { [query.sortBy || 'createdAt']: query.sortOrder } }),
      this.prisma.repair.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async findOne(id: number, user: AuthUser) {
    const repair = await this.prisma.repair.findFirst({ where: { id, deletedAt: null }, include: { customer: true, product: true, images: true } });
    if (!repair) throw new NotFoundException('Repair not found');
    await this.ownership.ensureShopAccess(repair.shopId, user);
    return repair;
  }

  async update(id: number, user: AuthUser, dto: UpdateRepairDto) {
    await this.findOne(id, user);
    return this.prisma.repair.update({
      where: { id },
      data: { ...dto, expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined, updatedById: user.id },
    });
  }

  async status(id: number, user: AuthUser, dto: UpdateRepairStatusDto) {
    const repair = await this.findOne(id, user);
    const updated = await this.prisma.repair.update({
      where: { id },
      data: { status: dto.status, deliveredAt: dto.status === RepairStatus.DELIVERED ? new Date() : undefined, updatedById: user.id },
    });
    if (dto.status === RepairStatus.DELIVERED || dto.status === RepairStatus.COMPLETED) {
      await this.recordImei(updated, ImeiEventType.REPAIR_OUT, user.id, String(repair.status), String(dto.status));
    }
    return updated;
  }

  async addImage(id: number, user: AuthUser, dto: RepairImageDto) {
    await this.findOne(id, user);
    return this.prisma.repairImage.create({ data: { repairId: id, ...dto } });
  }

  receipt(id: number, user: AuthUser) {
    return this.findOne(id, user);
  }

  private async recordImei(repair: { id: number; shopId: number; productId?: number | null; imei1?: string | null; serialNumber?: string | null }, eventType: ImeiEventType, userId: number, previousStatus?: string, newStatus?: string) {
    const imei = repair.imei1 || repair.serialNumber;
    if (!imei) return;
    await this.prisma.imeiHistory.create({
      data: { shopId: repair.shopId, productId: repair.productId, imei, serialNumber: repair.serialNumber, eventType, referenceType: 'REPAIR', referenceId: String(repair.id), previousStatus, newStatus, createdById: userId },
    });
  }
}
