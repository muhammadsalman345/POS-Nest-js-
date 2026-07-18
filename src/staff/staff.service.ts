import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { paginated, pagination } from '../common/utils/pagination.util';
import { sanitizeUser } from '../common/utils/user.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService, private readonly ownership: OwnershipService) {}

  permissions() {
    return this.prisma.permission.findMany({ orderBy: { name: 'asc' } });
  }

  roles() {
    return this.prisma.staffRole.findMany({
      orderBy: { name: 'asc' },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async create(shopId: number, user: AuthUser, dto: CreateStaffDto) {
    await this.ensureStaffManager(shopId, user);
    const { permissionIds, userId, name, email, phone, password, ...staffData } = dto;
    if (permissionIds?.length) await this.ensurePermissionsExist(permissionIds);

    return this.prisma.$transaction(async (tx) => {
      const staffUserId =
        userId ??
        (
          await this.createStaffAccount(tx, {
            name,
            email,
            phone,
            password,
          })
        ).id;

      await this.ensureAssignableUser(tx, staffUserId);
      const existing = await tx.shopStaff.findUnique({
        where: { shopId_userId: { shopId, userId: staffUserId } },
      });

      if (existing) {
        throw new ConflictException('This user is already staff in this shop');
      }

      const staff = await tx.shopStaff.create({
        data: {
          ...staffData,
          shopId,
          userId: staffUserId,
          createdById: user.id,
          staffPermissions: this.permissionCreateInput(permissionIds),
        },
      });
      return this.sanitizeStaff(await tx.shopStaff.findUniqueOrThrow({ where: { id: staff.id }, include: this.staffInclude }));
    });
  }

  async list(shopId: number, user: AuthUser, query: PaginationDto) {
    await this.ownership.ensureShopAccess(shopId, user);
    const { page, limit, skip, take } = pagination(query);
    const where: Prisma.ShopStaffWhereInput = {
      shopId,
      ...(query.search
        ? {
            OR: [
              { user: { name: { contains: query.search } } },
              { user: { phone: { contains: query.search } } },
              { user: { email: { contains: query.search } } },
              { role: { name: { contains: query.search } } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.shopStaff.findMany({
        where,
        include: this.staffInclude,
        skip,
        take,
        orderBy: { joinedAt: 'desc' },
      }),
      this.prisma.shopStaff.count({ where }),
    ]);
    return paginated(items.map((item) => this.sanitizeStaff(item)), total, page, limit);
  }

  async update(shopId: number, id: number, user: AuthUser, dto: UpdateStaffDto) {
    await this.ensureStaffManager(shopId, user);
    const staff = await this.prisma.shopStaff.findFirst({ where: { id, shopId } });
    if (!staff) throw new NotFoundException('Staff member not found');
    const { permissionIds, userId, name, email, phone, password, ...staffData } = dto;
    void userId;
    void name;
    void email;
    void phone;
    void password;
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
      return this.sanitizeStaff(await tx.shopStaff.findUniqueOrThrow({ where: { id }, include: this.staffInclude }));
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
    role: { include: { rolePermissions: { include: { permission: true } } } },
    staffPermissions: { include: { permission: true } },
  } satisfies Prisma.ShopStaffInclude;

  private async createStaffAccount(
    tx: Prisma.TransactionClient,
    input: {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    },
  ) {
    if (!input.name?.trim() || !input.phone?.trim() || !input.password) {
      throw new BadRequestException(
        'Name, phone and password are required for a new staff account',
      );
    }

    const exists = await tx.user.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { phone: input.phone.trim() },
          ...(input.email ? [{ email: input.email.trim().toLowerCase() }] : []),
        ],
      },
    });

    if (exists) throw new ConflictException('Phone or email already exists');

    return tx.user.create({
      data: {
        name: input.name.trim(),
        email: input.email?.trim().toLowerCase() || null,
        phone: input.phone.trim(),
        password: await bcrypt.hash(input.password, 10),
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActive: true,
      },
    });
  }

  private async ensureAssignableUser(tx: Prisma.TransactionClient, userId: number) {
    const target = await tx.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!target) throw new NotFoundException('Staff user not found');
    if (target.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Super admin cannot be assigned as shop staff');
    }
  }

  private sanitizeStaff<T extends { user?: unknown }>(staff: T) {
    if (!staff.user) return staff;
    return { ...staff, user: sanitizeUser(staff.user as Parameters<typeof sanitizeUser>[0]) };
  }

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
