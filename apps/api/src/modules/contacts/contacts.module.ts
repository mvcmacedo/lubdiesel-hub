import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { UsersModule } from '../users/users.module';
import { ContactsController } from './controllers/contacts.controller';
import { ContactsRepository } from './repositories/contacts.repository';
import { ContactsService } from './services/contacts.service';

@Module({
  imports: [CompaniesModule, UsersModule],
  controllers: [ContactsController],
  providers: [ContactsService, ContactsRepository],
  exports: [ContactsService],
})
export class ContactsModule {}
