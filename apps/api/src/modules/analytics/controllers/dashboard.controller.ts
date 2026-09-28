import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SalesQueryDto } from '../dto/sales-query.dto';
import { AnalyticsService } from '../services/analytics.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Dashboard cards, pipeline counts and follow-up summary' })
  summary() {
    return this.analyticsService.getSummary();
  }

  @Get('lead-sources')
  @ApiOperation({ summary: 'Lead count grouped by origin' })
  leadSources() {
    return this.analyticsService.getLeadSources();
  }

  @Get('loss-reasons')
  @ApiOperation({ summary: 'Lost-lead count grouped by reason' })
  lossReasons() {
    return this.analyticsService.getLossReasons();
  }

  @Get('sales')
  @ApiOperation({ summary: 'Daily completed-order totals for the last N days' })
  sales(@Query() query: SalesQueryDto) {
    return this.analyticsService.getSales(query.days);
  }
}
