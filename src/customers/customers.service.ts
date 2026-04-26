import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuthUser } from '../common/types/auth-user.type';
import { paginated, pagination } from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: { ...dto, userId: dto.userId || (user.role === UserRole.CUSTOMER ? user.id : null) } });
  }

  async list(query: PaginationDto) {
    const { page, limit, skip, take } = pagination(query);
    const where = { deletedAt: null, ...(query.search ? { OR: [{ name: { contains: query.search } }, { phone: { contains: query.search } }] } : {}) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({ where, skip, take, orderBy: { [query.sortBy || 'createdAt']: query.sortOrder } }),
      this.prisma.customer.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findFirst({ where: { id, deletedAt: null } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  update(id: number, dto: UpdateCustomerDto) {
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Customer deleted' };
  }
}
