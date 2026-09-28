import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { InventoryController } from './controllers/inventory.controller';
import { InventoryRepository } from './repositories/inventory.repository';
import { InventoryService } from './services/inventory.service';

@Module({
  imports: [ProductsModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryRepository],
  exports: [InventoryService],
})
export class InventoryModule {}
