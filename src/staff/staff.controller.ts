import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffService } from './staff.service';

@ApiTags('Staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get('permissions')
  permissions() { return this.staff.permissions(); }
  @Post('shops/:shopId/staff')
  create(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser, @Body() dto: CreateStaffDto) { return this.staff.create(+shopId, user, dto); }
  @Get('shops/:shopId/staff')
  list(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser) { return this.staff.list(+shopId, user); }
  @Patch('shops/:shopId/staff/:id')
  update(@Param('shopId') shopId: string, @Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateStaffDto) { return this.staff.update(+shopId, +id, user, dto); }
  @Delete('shops/:shopId/staff/:id')
  remove(@Param('shopId') shopId: string, @Param('id') id: string, @CurrentUser() user: AuthUser) { return this.staff.remove(+shopId, +id, user); }
}
