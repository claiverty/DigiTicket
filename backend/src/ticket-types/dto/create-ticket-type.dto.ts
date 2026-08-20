import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateTicketTypeDto {
  @ApiProperty({ example: 'Pista' })
  @IsString()
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({ example: 'Acesso à área geral do evento.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 7000, description: 'Preço em centavos.' })
  @IsInt()
  @Min(0)
  priceCents!: number;

  @ApiProperty({ example: 300 })
  @IsInt()
  @Min(1)
  capacity!: number;
}
