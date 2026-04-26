import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';

@Module({
  imports: [CommonModule],
  controllers: [ShopsController],
  providers: [ShopsService],
})
export class ShopsModule {}
