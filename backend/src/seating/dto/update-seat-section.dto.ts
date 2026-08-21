import { ApiProperty } from '@nestjs/swagger';
import { SeatDisplaySize } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateSeatSectionDto {
  @ApiProperty({ enum: SeatDisplaySize })
  @IsEnum(SeatDisplaySize)
  seatDisplaySize!: SeatDisplaySize;
}
