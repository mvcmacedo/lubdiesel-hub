import { Module } from '@nestjs/common';
import { ContactsModule } from '../contacts/contacts.module';
import { UsersModule } from '../users/users.module';
import { LeadsController } from './controllers/leads.controller';
import { LeadsRepository } from './repositories/leads.repository';
import { LeadsService } from './services/leads.service';

@Module({
  imports: [ContactsModule, UsersModule],
  controllers: [LeadsController],
  providers: [LeadsService, LeadsRepository],
  exports: [LeadsService],
})
export class LeadsModule {}
