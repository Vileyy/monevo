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
  @IsNumber()
  @IsOptional()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount?: number;

  @IsString()
  @IsOptional()
  @IsIn(['INCOME', 'EXPENSE'], {
    message: 'Type must be either INCOME or EXPENSE',
  })
  type?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsDateString({}, { message: 'Invalid date format' })
  @IsOptional()
  date?: string;

  @IsUUID('4', { message: 'walletId must be a valid UUID' })
  @IsOptional()
  walletId?: string;

  @IsUUID('4', { message: 'categoryId must be a valid UUID' })
  @IsOptional()
  categoryId?: string;
}
