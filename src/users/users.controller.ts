// src/users/users.controller.ts
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
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
  findAll() {
    return this.usersService.findAll();
  }

  // Example: Shop Module ke liye ek dummy endpoint
  @Get('shop/products')
  @Roles(Role.USER) // Ya USER role (jo POS operators honge) access kar sakte hain
  getShopProducts() {
    return { message: "Welcome to the Shop Module! You can see all products here.", role: "USER_ACCESS" };
  }

  // Example: Admin Dashboard ke liye ek dummy endpoint
  @Get('admin/dashboard-data')
  @Roles(Role.ADMIN)
  getAdminDashboardData() {
    return { message: "Welcome to the Admin Dashboard! Here's your admin data.", role: "ADMIN_ACCESS" };
  }

  // Example: Supplier Module ke liye ek dummy endpoint
  @Get('supplier/inventory')
  @Roles(Role.SUPPLIER)
  getSupplierInventory() {
    return { message: "Welcome to the Supplier Module! Manage your inventory here.", role: "SUPPLIER_ACCESS" };
  }
}