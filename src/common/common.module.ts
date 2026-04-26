import { Module } from '@nestjs/common';
import { OwnershipService } from './services/ownership.service';

@Module({
  providers: [OwnershipService],
  exports: [OwnershipService],
})
export class CommonModule {}
