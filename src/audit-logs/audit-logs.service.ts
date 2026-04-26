import { Injectable } from '@nestjs/common';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginated, pagination } from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationDto) {
    const { page, limit, skip, take } = pagination(query);
    const where = query.search ? { OR: [{ action: { contains: query.search } }, { module: { contains: query.search } }, { recordId: { contains: query.search } }] } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({ where, skip, take, include: { user: { select: { id: true, name: true, phone: true, role: true } } }, orderBy: { [query.sortBy || 'createdAt']: query.sortOrder } }),
      this.prisma.auditLog.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }
}
