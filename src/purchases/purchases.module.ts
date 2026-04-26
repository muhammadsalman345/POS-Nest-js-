import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { ProductsModule } from '../products/products.module';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';

@Module({ imports: [CommonModule, ProductsModule], controllers: [PurchasesController], providers: [PurchasesService] })
export class PurchasesModule {}
