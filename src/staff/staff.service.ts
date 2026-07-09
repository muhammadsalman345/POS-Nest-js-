import { Injectable, NotFoundException } from '@nestjs/common';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService, private readonly ownership: OwnershipService) {}

  permissions() {
    return this.prisma.permission.findMany({ orderBy: { name: 'asc' } });
  }

  async create(shopId: number, user: AuthUser, dto: CreateStaffDto) {
    await this.ownership.ensureShopAccess(shopId, user);
    return this.prisma.shopStaff.create({ data: { ...dto, shopId, createdById: user.id }, include: { user: true, role: true } });
  }

  async list(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    return this.prisma.shopStaff.findMany({ where: { shopId }, include: { user: true, role: true, staffPermissions: { include: { permission: true } } } });
  }

  async update(shopId: number, id: number, user: AuthUser, dto: UpdateStaffDto) {
    await this.ownership.ensureShopAccess(shopId, user);
    const staff = await this.prisma.shopStaff.findFirst({ where: { id, shopId } });
    if (!staff) throw new NotFoundException('Staff member not found');
    return this.prisma.shopStaff.update({ where: { id }, data: dto, include: { user: true, role: true } });
  }

  async remove(shopId: number, id: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    const staff = await this.prisma.shopStaff.findFirst({ where: { id, shopId } });
    if (!staff) throw new NotFoundException('Staff member not found');
    await this.prisma.shopStaff.delete({ where: { id } });
    return { message: 'Staff member removed' };
  }
}
