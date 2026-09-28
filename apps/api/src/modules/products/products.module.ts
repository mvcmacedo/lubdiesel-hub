import { Module } from '@nestjs/common';
import { ProductsController } from './controllers/products.controller';
import { ProductsRepository } from './repositories/products.repository';
import { ProductsService } from './services/products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService],
})
export class ProductsModule {}
