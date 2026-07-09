import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCustomerDto) { return this.customers.create(user, dto); }
  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: PaginationDto) { return this.customers.list(user, query); }
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.customers.findOne(+id, user); }
  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateCustomerDto) { return this.customers.update(+id, user, dto); }
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.customers.remove(+id, user); }
}
