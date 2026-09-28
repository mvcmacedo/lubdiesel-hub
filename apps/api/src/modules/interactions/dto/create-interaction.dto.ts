import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InteractionType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateInteractionDto {
  @ApiProperty({ enum: InteractionType })
  @IsEnum(InteractionType)
  type!: InteractionType;

  @ApiProperty({ example: 'Cliente recebeu apresentação comercial via WhatsApp.' })
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiPropertyOptional({ description: 'Related contact' })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Related lead' })
  @IsOptional()
  @IsUUID()
  leadId?: string;
}
