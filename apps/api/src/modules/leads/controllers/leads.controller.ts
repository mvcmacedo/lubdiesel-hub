import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ChangeLeadStageDto } from '../dto/change-lead-stage.dto';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { LeadQueryDto } from '../dto/lead-query.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { LeadsService } from '../services/leads.service';

@ApiTags('leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a lead (opportunity)' })
  create(@Body() dto: CreateLeadDto, @CurrentUser('id') userId: string) {
    return this.leadsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List leads (filters + search by contact)' })
  findAll(@Query() query: LeadQueryDto) {
    return this.leadsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a lead with its stage history' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lead (source, value, owner)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(id, dto);
  }

  @Patch(':id/stage')
  @ApiOperation({
    summary: 'Change a lead stage (records history; WON converts, LOST needs reason)',
  })
  changeStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeLeadStageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.leadsService.changeStage(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a lead' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.leadsService.remove(id);
  }
}
