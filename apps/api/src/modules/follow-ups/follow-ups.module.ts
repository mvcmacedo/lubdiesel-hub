import { Module } from '@nestjs/common';
import { ContactsModule } from '../contacts/contacts.module';
import { LeadsModule } from '../leads/leads.module';
import { UsersModule } from '../users/users.module';
import { FollowUpsController } from './controllers/follow-ups.controller';
import { FollowUpsRepository } from './repositories/follow-ups.repository';
import { FollowUpsService } from './services/follow-ups.service';

@Module({
  imports: [ContactsModule, LeadsModule, UsersModule],
  controllers: [FollowUpsController],
  providers: [FollowUpsService, FollowUpsRepository],
  exports: [FollowUpsService],
})
export class FollowUpsModule {}
