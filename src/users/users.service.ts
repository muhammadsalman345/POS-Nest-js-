// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  // <--- YAHAN TABDEELI KI HAI --->
  findOne(id: number): Promise<User | null> { // 'undefined' ki jagah 'null' kiya
    return this.usersRepository.findOne({ where: { id } });
  }

async updateStatus(userId: number): Promise<string> {
  const result = await this.usersRepository.query(
    `UPDATE user SET isActive = NOT isActive WHERE id = ?`,
    [userId]
  );

  if (result.affectedRows === 0) {
    throw new NotFoundException('User not found');
  }

  return 'User status updated successfully';
}

 
}