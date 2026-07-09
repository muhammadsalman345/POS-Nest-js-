import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateWarrantyClaimDto } from './dto/create-warranty-claim.dto';
import { CreateWarrantyDto } from './dto/create-warranty.dto';
import { WarrantiesService } from './warranties.service';

@ApiTags('Warranties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('warranties')
export class WarrantiesController {
  constructor(private readonly warranties: WarrantiesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWarrantyDto) { return this.warranties.create(user, dto); }
  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: PaginationDto) { return this.warranties.list(user, query); }
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.warranties.findOne(+id, user); }
  @Post(':id/claim')
  claim(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: CreateWarrantyClaimDto) { return this.warranties.claim(+id, user, dto); }
  @Get(':id/history')
  history(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.warranties.history(+id, user); }
}
