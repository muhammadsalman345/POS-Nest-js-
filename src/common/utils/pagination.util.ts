import { PaginationDto } from '../dto/pagination.dto';

export const pagination = (query: PaginationDto) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  return { page, limit, skip: (page - 1) * limit, take: limit };
};

export const paginated = <T>(items: T[], total: number, page: number, limit: number) => ({
  data: items,
  meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
});
