import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadSource, LeadStatus } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateLeadDto {
  @ApiProperty({ description: 'Contact this opportunity belongs to' })
  @IsUUID()
  contactId!: string;

  @ApiProperty({ enum: LeadSource })
  @IsEnum(LeadSource)
  source!: LeadSource;

  @ApiPropertyOptional({ enum: LeadStatus, default: LeadStatus.NEW })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ example: 1500.0, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedValue?: number;

  @ApiPropertyOptional({ description: 'Owner (user) responsible for this lead' })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;
}
