import { Module } from '@nestjs/common';
import { FollowUpsModule } from '../follow-ups/follow-ups.module';
import { InventoryModule } from '../inventory/inventory.module';
import { DashboardController } from './controllers/dashboard.controller';
import { AnalyticsService } from './services/analytics.service';

@Module({
  imports: [InventoryModule, FollowUpsModule],
  controllers: [DashboardController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
