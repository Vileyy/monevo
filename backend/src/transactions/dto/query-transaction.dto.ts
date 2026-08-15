import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class QueryTransactionDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID('4', { message: 'walletId must be a valid UUID' })
  @IsOptional()
  walletId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID('4', { message: 'categoryId must be a valid UUID' })
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'EXPENSE', enum: ['INCOME', 'EXPENSE'] })
  @IsString()
  @IsOptional()
  @IsIn(['INCOME', 'EXPENSE'], {
    message: 'Type must be either INCOME or EXPENSE',
  })
  type?: string;

  @ApiPropertyOptional({ example: '2026-08-01T00:00:00.000Z' })
  @IsDateString({}, { message: 'Invalid startDate format' })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31T23:59:59.000Z' })
  @IsDateString({}, { message: 'Invalid endDate format' })
  @IsOptional()
  endDate?: string;
}
