import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
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
    await this.ensureStaffManager(shopId, user);
    const { permissionIds, ...staffData } = dto;
    if (permissionIds?.length) await this.ensurePermissionsExist(permissionIds);

    return this.prisma.$transaction(async (tx) => {
      const staff = await tx.shopStaff.create({
        data: {
          ...staffData,
          shopId,
          createdById: user.id,
          staffPermissions: this.permissionCreateInput(permissionIds),
        },
      });
      return tx.shopStaff.findUniqueOrThrow({ where: { id: staff.id }, include: this.staffInclude });
    });
  }

  async list(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    return this.prisma.shopStaff.findMany({ where: { shopId }, include: this.staffInclude });
  }

  async update(shopId: number, id: number, user: AuthUser, dto: UpdateStaffDto) {
    await this.ensureStaffManager(shopId, user);
    const staff = await this.prisma.shopStaff.findFirst({ where: { id, shopId } });
    if (!staff) throw new NotFoundException('Staff member not found');
    const { permissionIds, ...staffData } = dto;
    if (permissionIds?.length) await this.ensurePermissionsExist(permissionIds);

    return this.prisma.$transaction(async (tx) => {
      if (permissionIds) {
        await tx.staffPermission.deleteMany({ where: { staffId: id } });
      }
      await tx.shopStaff.update({
        where: { id },
        data: {
          ...staffData,
          ...(permissionIds ? { staffPermissions: this.permissionCreateInput(permissionIds) } : {}),
        },
      });
      return tx.shopStaff.findUniqueOrThrow({ where: { id }, include: this.staffInclude });
    });
  }

  async remove(shopId: number, id: number, user: AuthUser) {
    await this.ensureStaffManager(shopId, user);
    const staff = await this.prisma.shopStaff.findFirst({ where: { id, shopId } });
    if (!staff) throw new NotFoundException('Staff member not found');
    await this.prisma.$transaction([
      this.prisma.staffPermission.deleteMany({ where: { staffId: id } }),
      this.prisma.shopStaff.delete({ where: { id } }),
    ]);
    return { message: 'Staff member removed' };
  }

  private readonly staffInclude = {
    user: true,
    role: true,
    staffPermissions: { include: { permission: true } },
  } satisfies Prisma.ShopStaffInclude;

  private async ensureStaffManager(shopId: number, user: AuthUser) {
    const shop = await this.ownership.ensureShopAccess(shopId, user);
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN || shop.ownerId === user.id) return shop;
    throw new ForbiddenException('Only the shop owner can manage staff users');
  }

  private permissionCreateInput(permissionIds?: number[]) {
    if (!permissionIds) return undefined;
    return { create: permissionIds.map((permissionId) => ({ permissionId })) };
  }

  private async ensurePermissionsExist(permissionIds: number[]) {
    const total = await this.prisma.permission.count({ where: { id: { in: permissionIds } } });
    if (total !== permissionIds.length) throw new NotFoundException('One or more permissions were not found');
  }
}
