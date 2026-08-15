import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class UpdateTransactionDto {
  @ApiPropertyOptional({ example: 90000000, minimum: 0.01 })
  @IsNumber()
  @IsOptional()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount?: number;

  @ApiPropertyOptional({ example: 'INCOME', enum: ['INCOME', 'EXPENSE'] })
  @IsString()
  @IsOptional()
  @IsIn(['INCOME', 'EXPENSE'], {
    message: 'Type must be either INCOME or EXPENSE',
  })
  type?: string;

  @ApiPropertyOptional({ example: 'August salary' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ example: '2026-08-15T00:00:00.000Z' })
  @IsDateString({}, { message: 'Invalid date format' })
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID('4', { message: 'walletId must be a valid UUID' })
  @IsOptional()
  walletId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID('4', { message: 'categoryId must be a valid UUID' })
  @IsOptional()
  categoryId?: string;
}
