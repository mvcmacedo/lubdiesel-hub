import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ProductQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by active flag' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value === 'true' : Boolean(value)))
  @IsBoolean()
  active?: boolean;
}
