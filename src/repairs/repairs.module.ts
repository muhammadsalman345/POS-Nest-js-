import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { RepairsController } from './repairs.controller';
import { RepairsService } from './repairs.service';

@Module({
  imports: [CommonModule],
  controllers: [RepairsController],
  providers: [RepairsService],
})
export class RepairsModule {}
