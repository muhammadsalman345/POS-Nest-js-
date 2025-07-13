// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
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

  // Add more user-related methods as needed (create, update, delete)
}