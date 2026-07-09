import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseFilterDto } from './dto/expense-filter.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesService } from './expenses.service';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}
  @Post('expenses')
  createRoot(@Query('shop_id') shopId: string, @CurrentUser() user: AuthUser, @Body() dto: CreateExpenseDto) { return this.expenses.create(+shopId, user, dto); }
  @Get('expenses')
  listRoot(@Query('shop_id') shopId: string, @CurrentUser() user: AuthUser, @Query() query: ExpenseFilterDto) { return this.expenses.list(+shopId, user, query); }
  @Post('shops/:shopId/expenses')
  create(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser, @Body() dto: CreateExpenseDto) { return this.expenses.create(+shopId, user, dto); }
  @Get('shops/:shopId/expenses')
  list(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser, @Query() query: ExpenseFilterDto) { return this.expenses.list(+shopId, user, query); }
  @Get('expenses/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.expenses.findOne(+id, user); }
  @Patch('expenses/:id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateExpenseDto) { return this.expenses.update(+id, user, dto); }
  @Delete('expenses/:id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.expenses.remove(+id, user); }
}
