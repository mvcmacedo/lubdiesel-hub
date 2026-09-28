import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'LUB-060' })
  @IsString()
  @MinLength(1)
  sku!: string;

  @ApiProperty({ example: 'Lubdiesel 60 ml' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 60, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  volumeMl!: number;

  @ApiProperty({ example: 12.5, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice!: number;

  @ApiProperty({ example: 29.9, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salePrice!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
