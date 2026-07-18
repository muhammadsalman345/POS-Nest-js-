import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CategoriesService } from './categories.service';
import { CategoryQueryDto } from './dto/category-query.dto';
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
  list(@CurrentUser() user: AuthUser, @Query() query: CategoryQueryDto) { return this.categories.list(user, query); }
  @Get(':id')
  findOne(@Param('id') id: string) { return this.categories.findOne(+id); }
  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateCategoryDto) { return this.categories.update(+id, user, dto); }
  @Delete(':id')
  remove(@Param('id') id: string) { return this.categories.remove(+id); }
}
