import { Module } from '@nestjs/common';
import { ContactsModule } from '../contacts/contacts.module';
import { LeadsModule } from '../leads/leads.module';
import { InteractionsController } from './controllers/interactions.controller';
import { InteractionsRepository } from './repositories/interactions.repository';
import { InteractionsService } from './services/interactions.service';

@Module({
  imports: [ContactsModule, LeadsModule],
  controllers: [InteractionsController],
  providers: [InteractionsService, InteractionsRepository],
})
export class InteractionsModule {}
