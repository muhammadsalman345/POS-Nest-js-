import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuthUser } from '../common/types/auth-user.type';
import { paginated, pagination } from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(user: AuthUser, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        ...dto,
        slug: dto.slug || this.slug(dto.name),
        createdById: user.id,
      },
    });
  }

  async list(query: PaginationDto) {
    const { page, limit, skip, take } = pagination(query);
    const where: Prisma.CategoryWhereInput = {
      deletedAt: null,
      ...(query.search ? { OR: [{ name: { contains: query.search } }, { slug: { contains: query.search } }] } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({ where, skip, take, include: { parent: true, children: true }, orderBy: { [query.sortBy || 'name']: query.sortOrder } }),
      this.prisma.category.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findFirst({ where: { id, deletedAt: null }, include: { parent: true, children: true } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: number, user: AuthUser, dto: UpdateCategoryDto) {
    await this.findOne(id);
    return this.prisma.category.update({
      where: { id },
      data: { ...dto, slug: dto.slug || (dto.name ? this.slug(dto.name) : undefined), updatedById: user.id },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Category deleted' };
  }

  private slug(value: string) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
}
