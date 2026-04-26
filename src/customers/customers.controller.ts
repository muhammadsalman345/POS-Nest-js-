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
  list(@Query() query: PaginationDto) { return this.customers.list(query); }
  @Get(':id')
  findOne(@Param('id') id: string) { return this.customers.findOne(+id); }
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) { return this.customers.update(+id, dto); }
  @Delete(':id')
  remove(@Param('id') id: string) { return this.customers.remove(+id); }
}
