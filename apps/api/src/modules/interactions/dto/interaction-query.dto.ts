import { ApiPropertyOptional } from '@nestjs/swagger';
import { InteractionType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class InteractionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional({ enum: InteractionType })
  @IsOptional()
  @IsEnum(InteractionType)
  type?: InteractionType;
}
