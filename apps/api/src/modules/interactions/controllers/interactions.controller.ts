import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CreateInteractionDto } from '../dto/create-interaction.dto';
import { InteractionQueryDto } from '../dto/interaction-query.dto';
import { InteractionsService } from '../services/interactions.service';

@ApiTags('interactions')
@ApiBearerAuth()
@Controller('interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  @ApiOperation({ summary: 'Record an interaction (timeline entry)' })
  create(@Body() dto: CreateInteractionDto, @CurrentUser('id') userId: string) {
    return this.interactionsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List interactions (timeline) by contact or lead' })
  findAll(@Query() query: InteractionQueryDto) {
    return this.interactionsService.findAll(query);
  }
}
