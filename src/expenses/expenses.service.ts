import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { serializeAuditData } from '../common/utils/audit.util';
import { paginated, pagination } from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseFilterDto } from './dto/expense-filter.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService, private readonly ownership: OwnershipService) {}

  async create(shopId: number, user: AuthUser, dto: CreateExpenseDto) {
    await this.ownership.ensureShopAccess(shopId, user);
    if (dto.productId) await this.ownership.ensureProductAccess(Number(dto.productId), user);
    const expense = await this.prisma.expense.create({
      data: {
        ...dto,
        shopId,
        productId: dto.productId ? Number(dto.productId) : undefined,
        expenseCategoryId: dto.expenseCategoryId ? Number(dto.expenseCategoryId) : undefined,
        title: dto.title || dto.description || 'Expense',
        type: dto.type || 'Misc',
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : new Date(),
        createdById: user.id,
      },
    });
    await this.audit(user.id, 'CREATE', expense.id, null, expense);
    return expense;
  }

  async list(shopId: number, user: AuthUser, query: ExpenseFilterDto) {
    await this.ownership.ensureShopAccess(shopId, user);
    const { page, limit, skip, take } = pagination(query);
    const where: Prisma.ExpenseWhereInput = {
      shopId,
      deletedAt: null,
      ...(query.productId ? { productId: Number(query.productId) } : {}),
      ...(query.categoryId ? { expenseCategoryId: Number(query.categoryId) } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.dateFrom || query.dateTo || query.from || query.to
        ? { expenseDate: { gte: query.dateFrom || query.from ? new Date(query.dateFrom || query.from!) : undefined, lte: query.dateTo || query.to ? new Date(query.dateTo || query.to!) : undefined } }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({ where, skip, take, orderBy: { [query.sortBy || 'createdAt']: query.sortOrder } }),
      this.prisma.expense.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async findOne(id: number, user: AuthUser) {
    const expense = await this.prisma.expense.findFirst({ where: { id, deletedAt: null }, include: { product: true, shop: true } });
    if (!expense) throw new NotFoundException('Expense not found');
    await this.ownership.ensureShopAccess(expense.shopId, user);
    return expense;
  }

  async update(id: number, user: AuthUser, dto: UpdateExpenseDto) {
    const old = await this.findOne(id, user);
    const expense = await this.prisma.expense.update({ where: { id }, data: { ...dto, expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined, updatedById: user.id } });
    await this.audit(user.id, 'UPDATE', id, old, expense);
    return expense;
  }

  async remove(id: number, user: AuthUser) {
    const old = await this.findOne(id, user);
    await this.prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit(user.id, 'DELETE', id, old, null);
    return { message: 'Expense deleted' };
  }

  private audit(userId: number, action: string, recordId: number, oldData: unknown, newData: unknown) {
    return this.prisma.auditLog.create({
      data: { userId, action, module: 'EXPENSE', recordId: String(recordId), oldData: serializeAuditData(oldData), newData: serializeAuditData(newData) },
    });
  }
}
