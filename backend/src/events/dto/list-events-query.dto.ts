import { EventCategory } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListEventsQueryDto {
  @ApiPropertyOptional({
    description:
      'Busca parcial por título, descrição, local ou cidade, ignorando acentos',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: EventCategory })
  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;

  @ApiPropertyOptional({
    description: 'Busca parcial pela cidade, ignorando acentos',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: '2026-12-12' })
  @IsOptional()
  @IsDateString()
  date?: string;
}
