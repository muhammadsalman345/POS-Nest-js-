import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { paginated, pagination } from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService, private readonly ownership: OwnershipService) {}

  async create(user: AuthUser, dto: CreateCustomerDto) {
    if (dto.shopId) await this.ownership.ensureShopAccess(Number(dto.shopId), user);
    return this.prisma.customer.create({ data: { ...dto, userId: dto.userId || (user.role === UserRole.BUYER ? user.id : null), createdById: user.id } });
  }

  async list(user: AuthUser, query: PaginationDto & { shop_id?: string; shopId?: string }) {
    const shopId = query.shop_id || query.shopId;
    if (shopId) await this.ownership.ensureShopAccess(Number(shopId), user);
    const shopFilter = shopId
      ? { shopId: Number(shopId) }
      : this.ownership.isAdmin(user)
        ? {}
        : { shop: { ownerId: user.id } };
    const { page, limit, skip, take } = pagination(query);
    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...shopFilter,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search } },
              { phone: { contains: query.search } },
              { cnic: { contains: query.search } },
              { sales: { some: { invoiceNumber: { contains: query.search } } } },
              { sales: { some: { invoiceNo: { contains: query.search } } } },
              { sales: { some: { items: { some: { OR: [{ imei1: { contains: query.search } }, { imei2: { contains: query.search } }, { serialNumber: { contains: query.search } }] } } } } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({ where, skip, take, orderBy: { [query.sortBy || 'createdAt']: query.sortOrder } }),
      this.prisma.customer.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async findOne(id: number, user: AuthUser) {
    const customer = await this.prisma.customer.findFirst({ where: { id, deletedAt: null }, include: { shop: true } });
    if (!customer) throw new NotFoundException('Customer not found');
    if (customer.shopId) await this.ownership.ensureShopAccess(customer.shopId, user);
    return customer;
  }

  async update(id: number, user: AuthUser, dto: UpdateCustomerDto) {
    await this.findOne(id, user);
    return this.prisma.customer.update({ where: { id }, data: { ...dto, updatedById: user.id } });
  }

  async remove(id: number, user: AuthUser) {
    await this.findOne(id, user);
    await this.prisma.customer.update({ where: { id }, data: { deletedAt: new Date(), updatedById: user.id } });
    return { message: 'Customer deleted' };
  }
}
