import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { WarrantiesController } from './warranties.controller';
import { WarrantiesService } from './warranties.service';

@Module({
  imports: [CommonModule],
  controllers: [WarrantiesController],
  providers: [WarrantiesService],
})
export class WarrantiesModule {}
