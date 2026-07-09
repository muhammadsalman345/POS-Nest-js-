import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCategoryDto) { return this.categories.create(user, dto); }
  @Get()
  list(@Query() query: PaginationDto) { return this.categories.list(query); }
  @Get(':id')
  findOne(@Param('id') id: string) { return this.categories.findOne(+id); }
  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateCategoryDto) { return this.categories.update(+id, user, dto); }
  @Delete(':id')
  remove(@Param('id') id: string) { return this.categories.remove(+id); }
}
