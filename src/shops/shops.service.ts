// src/shops/shops.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Shop } from './entities/shop.entity';
import { Repository } from 'typeorm';
import { CreateShopDto } from './dto/create-shop.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ShopsService {
  constructor(
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,
  ) {}
 async create(createShopDto: CreateShopDto, userId: number): Promise<Shop> {
    const shop = this.shopRepository.create({
      ...createShopDto,
      user: { id: userId }, // 👈 only pass userId
    });

    return await this.shopRepository.save(shop);
  }
  async findAll(): Promise<Shop[]> {
    return await this.shopRepository.find({
      relations: ['user'], // Optional: include user data
    });
  }

  async findOne(id: number): Promise<Shop> {
    const shop = await this.shopRepository.findOne({
      where: { id },
      relations: ['user'], // Optional: include user data
    });

    if (!shop) {
      throw new NotFoundException(`Shop with ID ${id} not found`);
    }

    return shop;
  }
}
