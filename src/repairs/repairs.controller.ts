import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateRepairDto } from './dto/create-repair.dto';
import { RepairImageDto } from './dto/repair-image.dto';
import { UpdateRepairStatusDto } from './dto/update-repair-status.dto';
import { UpdateRepairDto } from './dto/update-repair.dto';
import { RepairsService } from './repairs.service';

@ApiTags('Repairs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('repairs')
export class RepairsController {
  constructor(private readonly repairs: RepairsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRepairDto) { return this.repairs.create(user, dto); }
  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: PaginationDto) { return this.repairs.list(user, query); }
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.repairs.findOne(+id, user); }
  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateRepairDto) { return this.repairs.update(+id, user, dto); }
  @Patch(':id/status')
  status(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateRepairStatusDto) { return this.repairs.status(+id, user, dto); }
  @Post(':id/images')
  addImage(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: RepairImageDto) { return this.repairs.addImage(+id, user, dto); }
  @Get(':id/receipt-pdf')
  receipt(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.repairs.receipt(+id, user); }
  @Get(':id/delivery-pdf')
  delivery(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.repairs.receipt(+id, user); }
}
