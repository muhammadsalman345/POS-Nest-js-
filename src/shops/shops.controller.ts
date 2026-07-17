import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateShopDto } from './dto/create-shop.dto';
import { ReviewShopDto } from './dto/review-shop.dto';
import { UpdateShopStatusDto } from './dto/update-shop-status.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { ShopsService } from './shops.service';

@ApiTags('Shops')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shops')
export class ShopsController {
  constructor(private readonly shops: ShopsService) {}

  @Post()
  @Roles(
    UserRole.OWNER,
    UserRole.SELLER,
    UserRole.USER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateShopDto) {
    return this.shops.create(user, dto);
  }

  @Get('my')
  @Roles(
    UserRole.OWNER,
    UserRole.SELLER,
    UserRole.USER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  my(@CurrentUser() user: AuthUser, @Query() query: PaginationDto) {
    return this.shops.my(user, query);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: PaginationDto) {
    return this.shops.findAll(user, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.shops.findOne(+id, user);
  }

  @Patch(':id/review')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  review(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ReviewShopDto,
  ) {
    return this.shops.review(+id, user, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN)
  status(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateShopStatusDto,
  ) {
    return this.shops.status(+id, user, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateShopDto,
  ) {
    return this.shops.update(+id, user, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.shops.remove(+id, user);
  }
}
