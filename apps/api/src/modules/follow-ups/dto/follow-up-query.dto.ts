import { ApiPropertyOptional } from '@nestjs/swagger';
import { FollowUpStatus, FollowUpType } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export type FollowUpScope = 'today' | 'overdue' | 'upcoming';

export class FollowUpQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: FollowUpStatus })
  @IsOptional()
  @IsEnum(FollowUpStatus)
  status?: FollowUpStatus;

  @ApiPropertyOptional({ enum: FollowUpType })
  @IsOptional()
  @IsEnum(FollowUpType)
  type?: FollowUpType;

  @ApiPropertyOptional({
    enum: ['today', 'overdue', 'upcoming'],
    description: 'Convenience filter over PENDING follow-ups by scheduled date',
  })
  @IsOptional()
  @IsIn(['today', 'overdue', 'upcoming'])
  scope?: FollowUpScope;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contactId?: string;
}
