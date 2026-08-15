import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateWalletDto {
  @ApiProperty({ example: 'Cash' })
  @IsString()
  @IsNotEmpty({ message: 'Wallet name is required' })
  name: string;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Initial balance cannot be negative' })
  balance?: number;

  @ApiProperty({ example: 'CASH', enum: ['CASH', 'BANK', 'CREDIT_CARD'] })
  @IsString()
  @IsNotEmpty({ message: 'Wallet type is required' })
  type: string;
}
