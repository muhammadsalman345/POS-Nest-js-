import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { paginated, pagination } from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';

@Injectable()
export class SourcesService {
  constructor(private readonly prisma: PrismaService, private readonly ownership: OwnershipService) {}

  async create(shopId: number, user: AuthUser, dto: CreateSourceDto) {
    await this.ownership.ensureShopAccess(shopId, user);
    return this.prisma.source.create({ data: { ...dto, shopId, createdById: user.id } });
  }

  async list(shopId: number, user: AuthUser, query: PaginationDto) {
    await this.ownership.ensureShopAccess(shopId, user);
    const { page, limit, skip, take } = pagination(query);
    const where: Prisma.SourceWhereInput = {
      shopId,
      deletedAt: null,
      ...(query.search ? { OR: [{ name: { contains: query.search } }, { phone: { contains: query.search } }, { cnic: { contains: query.search } }, { companyName: { contains: query.search } }] } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.source.findMany({ where, skip, take, orderBy: { [query.sortBy || 'createdAt']: query.sortOrder } }),
      this.prisma.source.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async findOne(id: number, user: AuthUser) {
    const source = await this.prisma.source.findFirst({ where: { id, deletedAt: null }, include: { shop: true } });
    if (!source) throw new NotFoundException('Source not found');
    await this.ownership.ensureShopAccess(source.shopId, user);
    return source;
  }

  async update(id: number, user: AuthUser, dto: UpdateSourceDto) {
    await this.findOne(id, user);
    return this.prisma.source.update({ where: { id }, data: { ...dto, updatedById: user.id } });
  }

  async remove(id: number, user: AuthUser) {
    await this.findOne(id, user);
    await this.prisma.source.update({ where: { id }, data: { deletedAt: new Date(), updatedById: user.id } });
    return { message: 'Source deleted' };
  }
}
