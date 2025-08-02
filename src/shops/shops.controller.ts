// src/shops/shops.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Req,
} from '@nestjs/common';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('shops')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

 @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateShopDto, @Req() req) {
    const userId = req.user.userId;
    return this.shopsService.create(dto, userId);
  }
  @Get()
  findAll() {
    return this.shopsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopsService.findOne(+id);
  }
}
