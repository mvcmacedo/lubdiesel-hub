import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OrderSource } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ enum: OrderSource })
  @IsOptional()
  @IsEnum(OrderSource)
  source?: OrderSource;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
