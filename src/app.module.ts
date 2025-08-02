// src/app.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module'; // AuthModule sahi import hua hai


// Aapki typeOrmConfig file ko import karein
import { typeOrmConfig } from './config/ormconfig';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { ShopsModule } from './shops/shops.module';


@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig), // Database configuration sahi pass ho rahi hai
    AuthModule, // AuthModule imports array mein shamil hai
    UsersModule, ProductsModule, ShopsModule, // Ye comment out hai, jo theek hai agar abhi iski zaroorat nahi
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}