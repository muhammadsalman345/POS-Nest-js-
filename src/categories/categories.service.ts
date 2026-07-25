import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { paginated, pagination } from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryQueryDto } from './dto/category-query.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ensureDefaultCategories } from './default-categories';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  async create(user: AuthUser, dto: CreateCategoryDto) {
    if (dto.shopId) {
      await this.ownership.ensureShopAccess(dto.shopId, user);
    }

    if (dto.parentId) {
      await this.ensureParentCategory(dto.parentId, dto.shopId);
    }

    const slug = dto.slug || this.slug(dto.name, dto.shopId, dto.parentId);
    const existing = await this.prisma.category.findFirst({
      where: { slug, deletedAt: null },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.category.create({
      data: {
        ...dto,
        slug,
        createdById: user.id,
      },
    });
  }

  async list(user: AuthUser, query: CategoryQueryDto) {
    await ensureDefaultCategories(this.prisma);

    if (query.shop_id) {
      await this.ownership.ensureShopAccess(query.shop_id, user);
    }

    const { page, limit, skip, take } = pagination(query);
    const where: Prisma.CategoryWhereInput = {
      deletedAt: null,
      ...(query.shop_id || query.search
        ? {
            AND: [
              query.shop_id
                ? { OR: [{ shopId: null }, { shopId: query.shop_id }] }
                : { shopId: null },
              ...(query.search
                ? [
                    {
                      OR: [
                        { name: { contains: query.search } },
                        { slug: { contains: query.search } },
                      ],
                    },
                  ]
                : []),
            ],
          }
        : { shopId: null }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        skip,
        take,
        include: {
          parent: true,
          children: {
            where: {
              deletedAt: null,
              ...(query.shop_id
                ? { OR: [{ shopId: null }, { shopId: query.shop_id }] }
                : { shopId: null }),
            },
            orderBy: { name: 'asc' },
          },
          shop: { select: { id: true, name: true } },
        },
        orderBy: { [this.safeSortBy(query.sortBy)]: query.sortOrder },
      }),
      this.prisma.category.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: { parent: true, children: true },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: number, user: AuthUser, dto: UpdateCategoryDto) {
    await this.findOne(id);
    if (dto.parentId) {
      await this.ensureParentCategory(dto.parentId, dto.shopId);
    }
    return this.prisma.category.update({
      where: { id },
      data: {
        ...dto,
        slug:
          dto.slug ||
          (dto.name
            ? this.slug(dto.name, dto.shopId, dto.parentId)
            : undefined),
        updatedById: user.id,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'Category deleted' };
  }

  private async ensureParentCategory(parentId: number, shopId?: number) {
    const parent = await this.prisma.category.findFirst({
      where: {
        id: parentId,
        deletedAt: null,
        OR: [{ shopId: null }, ...(shopId ? [{ shopId }] : [])],
      },
    });

    if (!parent) throw new NotFoundException('Parent category not found');
  }

  private slug(value: string, shopId?: number, parentId?: number) {
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (shopId && parentId) return `shop-${shopId}-parent-${parentId}-${slug}`;
    if (shopId) return `shop-${shopId}-${slug}`;
    return parentId ? `parent-${parentId}-${slug}` : slug;
  }

  private safeSortBy(sortBy?: string): Prisma.CategoryScalarFieldEnum {
    const allowed: Prisma.CategoryScalarFieldEnum[] = [
      'createdAt',
      'updatedAt',
      'name',
      'status',
    ];
    return allowed.includes(sortBy as Prisma.CategoryScalarFieldEnum)
      ? (sortBy as Prisma.CategoryScalarFieldEnum)
      : 'name';
  }
}
