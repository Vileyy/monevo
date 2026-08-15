import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class QueryTransactionDto {
  @IsUUID('4', { message: 'walletId must be a valid UUID' })
  @IsOptional()
  walletId?: string;

  @IsUUID('4', { message: 'categoryId must be a valid UUID' })
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  @IsIn(['INCOME', 'EXPENSE'], {
    message: 'Type must be either INCOME or EXPENSE',
  })
  type?: string;

  @IsDateString({}, { message: 'Invalid startDate format' })
  @IsOptional()
  startDate?: string;

  @IsDateString({}, { message: 'Invalid endDate format' })
  @IsOptional()
  endDate?: string;
}
