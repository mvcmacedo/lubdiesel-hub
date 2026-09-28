import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus, LostReason } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ChangeLeadStageDto {
  @ApiProperty({ enum: LeadStatus })
  @IsEnum(LeadStatus)
  status!: LeadStatus;

  @ApiPropertyOptional({ description: 'Optional note recorded in the stage history' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ enum: LostReason, description: 'Required when status is LOST' })
  @IsOptional()
  @IsEnum(LostReason)
  lostReason?: LostReason;
}
