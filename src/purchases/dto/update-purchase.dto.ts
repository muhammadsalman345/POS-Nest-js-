import { PartialType } from '@nestjs/swagger';
import { PurchaseMetaDto } from './create-purchase.dto';

export class UpdatePurchaseDto extends PartialType(PurchaseMetaDto) {}
