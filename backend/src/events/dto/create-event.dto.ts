import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventCategory, EventSaleMode } from '@prisma/client';

export class CreateEventDto {
  @ApiProperty({ example: 'Festival Luzes da Cidade' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @ApiProperty({ example: 'Uma noite de música e experiências.' })
  @IsString()
  @MinLength(20)
  @MaxLength(5_000)
  description!: string;

  @ApiProperty({ enum: EventCategory, example: EventCategory.SHOW })
  @IsEnum(EventCategory)
  category!: EventCategory;

  @ApiProperty({
    enum: EventSaleMode,
    example: EventSaleMode.GENERAL_ADMISSION,
  })
  @IsEnum(EventSaleMode)
  saleMode!: EventSaleMode;

  @ApiProperty({ example: 'Arena Central' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  venueName!: string;

  @ApiProperty({ example: 'Avenida das Artes, 500' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  address!: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city!: string;

  @ApiProperty({ example: 'SP' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Length(2, 2)
  state!: string;

  @ApiProperty({ example: '2026-12-12T22:00:00.000Z' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-12-13T01:00:00.000Z' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ example: 'https://exemplo.com/cartaz.jpg' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2_000)
  posterUrl?: string;
}
