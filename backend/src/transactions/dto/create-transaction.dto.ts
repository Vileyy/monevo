import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: 90000000, minimum: 0.01 })
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiProperty({ example: 'INCOME', enum: ['INCOME', 'EXPENSE'] })
  @IsString()
  @IsNotEmpty({ message: 'Transaction type is required' })
  @IsIn(['INCOME', 'EXPENSE'], {
    message: 'Type must be either INCOME or EXPENSE',
  })
  type: string;

  @ApiPropertyOptional({ example: 'August salary' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ example: '2026-08-15T00:00:00.000Z' })
  @IsDateString({}, { message: 'Invalid date format' })
  @IsOptional()
  date?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'walletId must be a valid UUID' })
  @IsNotEmpty({ message: 'walletId is required' })
  walletId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'categoryId must be a valid UUID' })
  @IsNotEmpty({ message: 'categoryId is required' })
  categoryId: string;
}
