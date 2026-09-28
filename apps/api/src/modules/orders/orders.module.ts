import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { ContactsModule } from '../contacts/contacts.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductsModule } from '../products/products.module';
import { OrdersController } from './controllers/orders.controller';
import { OrdersRepository } from './repositories/orders.repository';
import { OrdersService } from './services/orders.service';

@Module({
  imports: [ProductsModule, InventoryModule, ContactsModule, CompaniesModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService],
})
export class OrdersModule {}
