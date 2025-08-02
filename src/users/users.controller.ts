// src/users/users.controller.ts
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { errorResponse, successResponse } from 'src/common/utils/response.util';
         // Import kiya

@Controller('users')
// Har method par guard lagane ke bajaye, controller level par guards laga sakte hain
// Har request par JWT check hoga, phir role check hoga
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  // Ye endpoint koi bhi authenticated aur active user access kar sakta hai (admin, user, supplier)
  @Roles(Role.ADMIN, Role.USER, Role.SUPPLIER)
  getProfile(@Req() req) {
    // req.user mein JwtStrategy se return kiya gaya user data hoga
    return req.user;
  }

  @Get('all')
  // Ye endpoint sirf ADMIN role wala user access kar sakta hai
  @Roles(Role.ADMIN)
@Roles(Role.ADMIN)
async findAll() {
  try {
    const users = await this.usersService.findAll();
    return successResponse(users, 'All users fetched');
  } catch (err) {
    return errorResponse('Failed to fetch users', 500, err.message);
  }
}

}