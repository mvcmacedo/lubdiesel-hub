import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RawResponse } from '../../../common/decorators/raw-response.decorator';
import { ChangeLeadStageDto } from '../../leads/dto/change-lead-stage.dto';
import { PipelineBoardQueryDto } from '../dto/pipeline-board-query.dto';
import { PipelineService } from '../services/pipeline.service';

@ApiTags('pipeline')
@ApiBearerAuth()
@Controller('pipeline')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Get()
  @RawResponse()
  @ApiOperation({ summary: 'Get the Kanban board grouped by stage' })
  getBoard(@Query() query: PipelineBoardQueryDto) {
    return this.pipelineService.getBoard(query);
  }

  @Patch('leads/:id/move')
  @ApiOperation({ summary: 'Move a lead to another stage (records history)' })
  move(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeLeadStageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.pipelineService.move(id, dto, userId);
  }
}
