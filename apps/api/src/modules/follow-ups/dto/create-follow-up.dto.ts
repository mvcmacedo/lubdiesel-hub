import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FollowUpType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateFollowUpDto {
  @ApiProperty({ enum: FollowUpType })
  @IsEnum(FollowUpType)
  type!: FollowUpType;

  @ApiProperty({ example: '2026-10-05T14:00:00.000Z' })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Related lead' })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional({ description: 'Related contact' })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Owner (user) responsible for this follow-up' })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;
}
