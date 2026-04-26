import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { ProductsModule } from '../products/products.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({ imports: [CommonModule, ProductsModule], controllers: [InventoryController], providers: [InventoryService] })
export class InventoryModule {}
