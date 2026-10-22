import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
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

  @ApiPropertyOptional({
    example: 'coffee',
    description:
      'Case-insensitive search on transaction note. Returns paginated results when combined with page/limit.',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    default: 1,
    description:
      'When provided (together with limit), the response becomes a paginated envelope: { data, meta }.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ example: 'date', enum: ['date', 'amount'] })
  @IsIn(['date', 'amount'], { message: 'sortBy must be either date or amount' })
  @IsOptional()
  sortBy?: 'date' | 'amount';

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'] })
  @IsIn(['asc', 'desc'], {
    message: 'sortOrder must be either asc or desc',
  })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
