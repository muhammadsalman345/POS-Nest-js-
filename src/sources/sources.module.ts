import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';

@Module({
  imports: [CommonModule],
  controllers: [SourcesController],
  providers: [SourcesService],
})
export class SourcesModule {}
