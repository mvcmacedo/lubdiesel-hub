import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CreateFollowUpDto } from '../dto/create-follow-up.dto';
import { FollowUpQueryDto } from '../dto/follow-up-query.dto';
import { UpdateFollowUpDto } from '../dto/update-follow-up.dto';
import { FollowUpsService } from '../services/follow-ups.service';

@ApiTags('follow-ups')
@ApiBearerAuth()
@Controller('follow-ups')
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a follow-up' })
  create(@Body() dto: CreateFollowUpDto, @CurrentUser('id') userId: string) {
    return this.followUpsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List follow-ups (status/scope/owner filters)' })
  findAll(@Query() query: FollowUpQueryDto) {
    return this.followUpsService.findAll(query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Counts of today / overdue / upcoming follow-ups' })
  @ApiQuery({ name: 'assignedUserId', required: false })
  summary(@Query('assignedUserId') assignedUserId?: string) {
    return this.followUpsService.summary(assignedUserId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a follow-up by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.followUpsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a follow-up' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFollowUpDto) {
    return this.followUpsService.update(id, dto);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark a follow-up as completed' })
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.followUpsService.complete(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a follow-up' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.followUpsService.cancel(id);
  }
}
