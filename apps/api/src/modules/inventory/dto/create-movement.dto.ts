import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { InventoryMovementType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, NotEquals } from 'class-validator';

export class CreateMovementDto {
  @ApiProperty({ description: 'Product the movement applies to' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ enum: InventoryMovementType })
  @IsEnum(InventoryMovementType)
  type!: InventoryMovementType;

  @ApiProperty({
    example: 100,
    description: 'Positive quantity. ADJUSTMENT may be negative to decrease the balance.',
  })
  @Type(() => Number)
  @IsInt()
  @NotEquals(0)
  quantity!: number;

  @ApiPropertyOptional({ default: 'unit' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Related entity id (e.g. an order id)' })
  @IsOptional()
  @IsString()
  referenceId?: string;
}
