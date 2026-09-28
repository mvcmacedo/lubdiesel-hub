import { Module } from '@nestjs/common';
import { LeadsModule } from '../leads/leads.module';
import { PipelineController } from './controllers/pipeline.controller';
import { PipelineService } from './services/pipeline.service';

@Module({
  imports: [LeadsModule],
  controllers: [PipelineController],
  providers: [PipelineService],
})
export class PipelineModule {}
