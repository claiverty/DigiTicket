import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ValidateTicketDto {
  @ApiProperty({
    description: 'Token completo do QR Code ou código manual do ingresso',
    example: 'DT-8F4A-2B19-7C3E',
  })
  @IsString()
  @Length(8, 500)
  code!: string;
}
