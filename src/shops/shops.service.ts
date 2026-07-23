import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ShopApprovalStatus, ShopStatus, UserRole } from '@prisma/client';
import { existsSync, unlinkSync } from 'fs';
import { join, normalize } from 'path';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { serializeAuditData } from '../common/utils/audit.util';
import { paginated, pagination } from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { ShopQueryDto } from './dto/shop-query.dto';
import { UpdateShopStatusDto } from './dto/update-shop-status.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { ShopImageSlot, shopImagePath } from './shop-image-upload';

@Injectable()
export class ShopsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  async create(user: AuthUser, dto: CreateShopDto) {
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;
    const status = dto.status ?? ShopStatus.ACTIVE;
    const slug = dto.slug || this.slug(dto.name);
    this.validateActivePayload({ ...dto, status });
    await this.ensureUniqueShopFields({ slug, email: dto.email, phone: dto.phone });
    const shop = await this.prisma.shop.create({
      data: {
        ...dto,
        slug,
        address: dto.address?.trim() || '',
        city: dto.city?.trim() || '',
        phone: dto.phone?.trim() || null,
        status,
        isActive: status === ShopStatus.ACTIVE && isSuperAdmin,
        ownerId: user.id,
        createdById: user.id,
        approvalStatus: status === ShopStatus.DRAFT ? ShopApprovalStatus.PENDING : isSuperAdmin ? ShopApprovalStatus.APPROVED : ShopApprovalStatus.PENDING,
        approvedAt: status === ShopStatus.ACTIVE && isSuperAdmin ? new Date() : undefined,
        approvedById: status === ShopStatus.ACTIVE && isSuperAdmin ? user.id : undefined,
      },
    });
    await this.audit(user.id, 'CREATE', shop.id, null, shop);
    return shop;
  }

  async my(user: AuthUser, query: ShopQueryDto) {
    return this.list(query, { ownerId: user.id });
  }

  async findAll(user: AuthUser, query: ShopQueryDto) {
    const isAdmin = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;

    if (isAdmin) {
      return this.list(query, query.ownerId ? { ownerId: query.ownerId } : {});
    }

    return this.list(query, { ownerId: user.id });
  }

  async findOne(id: number, user: AuthUser) {
    return this.ownership.ensureShopAccess(id, user);
  }

  async update(id: number, user: AuthUser, dto: UpdateShopDto) {
    const old = await this.ownership.ensureShopAccess(id, user);
    const isAdmin = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;
    const nextStatus = dto.status ?? old.status;
    const slug = dto.slug || (dto.name ? this.slug(dto.name) : undefined);
    this.validateActivePayload({ ...old, ...dto, status: nextStatus } as CreateShopDto);
    await this.ensureUniqueShopFields(
      { slug, email: dto.email, phone: dto.phone },
      id,
    );
    const shop = await this.prisma.shop.update({
      where: { id },
      data: {
        ...dto,
        slug,
        address: dto.address?.trim(),
        city: dto.city?.trim(),
        phone: dto.phone?.trim() || (dto.phone === '' ? null : undefined),
        approvalStatus: isAdmin ? undefined : ShopApprovalStatus.PENDING,
        rejectionReason: isAdmin ? undefined : null,
        approvedAt: isAdmin ? undefined : null,
        approvedById: isAdmin ? undefined : null,
        isActive: nextStatus === ShopStatus.ACTIVE && (isAdmin || old.approvalStatus === ShopApprovalStatus.APPROVED),
        updatedById: user.id,
      },
    });
    this.deleteReplacedImage(old.logo, shop.logo);
    this.deleteReplacedImage(old.coverImage, shop.coverImage);
    await this.audit(user.id, 'UPDATE', id, old, shop);
    return shop;
  }

  async remove(id: number, user: AuthUser) {
    const old = await this.ownership.ensureShopAccess(id, user);
    await this.prisma.shop.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    this.deleteStoredImage(old.logo);
    this.deleteStoredImage(old.coverImage);
    await this.audit(user.id, 'DELETE', id, old, null);
    return { message: 'Shop deleted' };
  }

  uploadedImage(slot: ShopImageSlot, file: any) {
    if (!file?.filename) {
      throw new BadRequestException('Image file is required.');
    }

    const path = shopImagePath(slot, file.filename);
    return {
      path,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  deleteUploadedImage(slot: ShopImageSlot, path: string) {
    if (!path) {
      throw new BadRequestException('Image path is required.');
    }

    if (!path.startsWith(`/uploads/shops/${slot}/`)) {
      throw new BadRequestException('Image path does not match the requested slot.');
    }

    this.deleteStoredImage(path);
    return { message: 'Image deleted' };
  }

  async review(id: number, user: AuthUser, dto: { approvalStatus: ShopApprovalStatus; paymentRequired?: boolean; paymentAmount?: number; rejectionReason?: string }) {
    const old = await this.prisma.shop.findFirst({ where: { id, deletedAt: null } });
    if (!old) throw new NotFoundException('Shop not found');
    if (old.ownerId === user.id) {
      throw new ForbiddenException('You cannot review your own shop.');
    }
    const isApproved = dto.approvalStatus === ShopApprovalStatus.APPROVED;
    const shop = await this.prisma.shop.update({
      where: { id },
      data: {
        approvalStatus: dto.approvalStatus,
        paymentRequired: dto.paymentRequired ?? dto.approvalStatus === ShopApprovalStatus.PAYMENT_REQUIRED,
        paymentAmount: dto.paymentAmount,
        rejectionReason: dto.rejectionReason,
        status: isApproved ? ShopStatus.ACTIVE : old.status === ShopStatus.DRAFT ? ShopStatus.DRAFT : ShopStatus.INACTIVE,
        isActive: isApproved,
        approvedAt: isApproved ? new Date() : null,
        approvedById: isApproved ? user.id : null,
      },
      include: { owner: { select: { id: true, name: true, phone: true, email: true, role: true } } },
    });
    await this.audit(user.id, 'REVIEW', id, old, shop);
    return shop;
  }

  async status(id: number, user: AuthUser, dto: UpdateShopStatusDto) {
    if (dto.isActive === undefined && dto.status === undefined) {
      throw new BadRequestException('isActive or status is required');
    }

    const old = await this.ownership.ensureShopAccess(id, user);
    const nextIsActive = dto.isActive ?? dto.status === ShopStatus.ACTIVE;
    const nextStatus = dto.status ?? (nextIsActive ? ShopStatus.ACTIVE : ShopStatus.INACTIVE);
    const shop = await this.prisma.shop.update({
      where: { id },
      data: {
        isActive: nextIsActive,
        status: nextStatus,
        updatedById: user.id,
      },
    });
    await this.audit(user.id, 'STATUS', id, old, shop);
    return shop;
  }

  private async list(query: ShopQueryDto, extra: Prisma.ShopWhereInput) {
    const { page, limit, skip, take } = pagination(query);
    const where: Prisma.ShopWhereInput = {
      ...extra,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search } },
              { city: { contains: query.search } },
              { area: { contains: query.search } },
              { owner: { name: { contains: query.search } } },
              { owner: { phone: { contains: query.search } } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.shop.findMany({
        where,
        skip,
        take,
        orderBy: { [this.safeSortBy(query.sortBy)]: query.sortOrder },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              role: true,
              status: true,
              isActive: true,
            },
          },
        },
      }),
      this.prisma.shop.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  private audit(userId: number, action: string, recordId: number, oldData: unknown, newData: unknown) {
    return this.prisma.auditLog.create({
      data: { userId, action, module: 'SHOP', recordId: String(recordId), oldData: serializeAuditData(oldData), newData: serializeAuditData(newData) },
    });
  }

  private slug(value: string) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  private validateActivePayload(dto: CreateShopDto) {
    if (dto.status === ShopStatus.DRAFT) {
      return;
    }

    const missingFields = [
      !dto.name?.trim() ? 'Shop name' : '',
      !dto.slug?.trim() ? 'Shop code' : '',
      !dto.phone?.trim() ? 'Phone' : '',
      !dto.email?.trim() ? 'Email' : '',
      !dto.address?.trim() ? 'Address' : '',
      !dto.city?.trim() ? 'City' : '',
      dto.latitude === undefined || dto.latitude === null ? 'Latitude' : '',
      dto.longitude === undefined || dto.longitude === null ? 'Longitude' : '',
      !dto.logo?.trim() ? 'Shop logo' : '',
      !dto.coverImage?.trim() ? 'Shop cover image' : '',
    ].filter(Boolean);

    if (missingFields.length) {
      throw new BadRequestException(`${missingFields.join(', ')} required.`);
    }
  }

  private async ensureUniqueShopFields(
    fields: { slug?: string; email?: string | null; phone?: string | null },
    ignoreId?: number,
  ) {
    const checks: Prisma.ShopWhereInput[] = [];

    if (fields.slug?.trim()) checks.push({ slug: fields.slug.trim() });
    if (fields.email?.trim()) checks.push({ email: fields.email.trim().toLowerCase() });
    if (fields.phone?.trim()) checks.push({ phone: fields.phone.trim() });

    if (!checks.length) return;

    const existing = await this.prisma.shop.findFirst({
      where: {
        deletedAt: null,
        id: ignoreId ? { not: ignoreId } : undefined,
        OR: checks,
      },
    });

    if (!existing) return;

    if (fields.slug && existing.slug === fields.slug) {
      throw new ConflictException('Shop code already exists.');
    }

    if (fields.email && existing.email === fields.email.trim().toLowerCase()) {
      throw new ConflictException('Shop email already exists.');
    }

    if (fields.phone && existing.phone === fields.phone.trim()) {
      throw new ConflictException('Shop phone already exists.');
    }
  }

  private safeSortBy(sortBy?: string): Prisma.ShopScalarFieldEnum {
    const allowed: Prisma.ShopScalarFieldEnum[] = ['createdAt', 'updatedAt', 'name', 'city', 'status'];
    return allowed.includes(sortBy as Prisma.ShopScalarFieldEnum)
      ? (sortBy as Prisma.ShopScalarFieldEnum)
      : 'createdAt';
  }

  private deleteReplacedImage(previous?: string | null, next?: string | null) {
    if (previous && previous !== next) {
      this.deleteStoredImage(previous);
    }
  }

  private deleteStoredImage(path?: string | null) {
    if (!path?.startsWith('/uploads/shops/')) {
      return;
    }

    const uploadsRoot = join(process.cwd(), 'uploads');
    const absolutePath = normalize(join(process.cwd(), path));

    if (!absolutePath.startsWith(uploadsRoot) || !existsSync(absolutePath)) {
      return;
    }

    unlinkSync(absolutePath);
  }
}
