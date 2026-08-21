import { ApiProperty } from '@nestjs/swagger';
import { SeatDisplaySize } from '@prisma/client';
import {
  IsInt,
  IsEnum,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSeatSectionDto {
  @ApiProperty({ example: 'Plateia' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 12000, description: 'Preço em centavos' })
  @IsInt()
  @Min(0)
  priceCents!: number;

  @ApiProperty({ example: 5, maximum: 26 })
  @IsInt()
  @Min(1)
  @Max(26)
  rows!: number;

  @ApiProperty({ example: 12, maximum: 50 })
  @IsInt()
  @Min(1)
  @Max(50)
  seatsPerRow!: number;

  @ApiProperty({ enum: SeatDisplaySize, example: SeatDisplaySize.STANDARD })
  @IsEnum(SeatDisplaySize)
  seatDisplaySize!: SeatDisplaySize;
}
