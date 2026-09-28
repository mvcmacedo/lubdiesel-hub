import { ApiPropertyOptional } from '@nestjs/swagger';
import { LeadSource } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class PipelineBoardQueryDto {
  @ApiPropertyOptional({ enum: LeadSource })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;
}
