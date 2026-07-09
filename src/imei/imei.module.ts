import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { ImeiController } from './imei.controller';
import { ImeiService } from './imei.service';

@Module({
  imports: [CommonModule],
  controllers: [ImeiController],
  providers: [ImeiService],
})
export class ImeiModule {}
