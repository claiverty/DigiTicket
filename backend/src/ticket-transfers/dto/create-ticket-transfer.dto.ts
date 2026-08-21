import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class CreateTicketTransferDto {
  @ApiProperty({ example: 'cliente2@demo.com' })
  @IsEmail()
  @MaxLength(254)
  recipientEmail!: string;
}
