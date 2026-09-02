import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { ProductsModule } from '../products/products.module';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';

@Module({ imports: [CommonModule, ProductsModule], controllers: [MarketplaceController], providers: [MarketplaceService] })
export class MarketplaceModule {}
