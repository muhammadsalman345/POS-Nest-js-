import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';

@Module({ imports: [CommonModule], controllers: [SellersController], providers: [SellersService] })
export class SellersModule {}
