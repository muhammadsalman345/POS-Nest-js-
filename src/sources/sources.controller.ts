import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateSourceDto } from './dto/create-source.dto';
import { SourcesService } from './sources.service';
import { UpdateSourceDto } from './dto/update-source.dto';

@ApiTags('Sources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SourcesController {
  constructor(private readonly sources: SourcesService) {}

  @Post('sources')
  createRoot(@Query('shop_id') shopId: string, @CurrentUser() user: AuthUser, @Body() dto: CreateSourceDto) { return this.sources.create(+shopId, user, dto); }
  @Get('sources')
  listRoot(@Query('shop_id') shopId: string, @CurrentUser() user: AuthUser, @Query() query: PaginationDto) { return this.sources.list(+shopId, user, query); }
  @Post('shops/:shopId/sources')
  create(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser, @Body() dto: CreateSourceDto) { return this.sources.create(+shopId, user, dto); }
  @Get('shops/:shopId/sources')
  list(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser, @Query() query: PaginationDto) { return this.sources.list(+shopId, user, query); }
  @Get('sources/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.sources.findOne(+id, user); }
  @Patch('sources/:id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateSourceDto) { return this.sources.update(+id, user, dto); }
  @Delete('sources/:id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.sources.remove(+id, user); }
}
