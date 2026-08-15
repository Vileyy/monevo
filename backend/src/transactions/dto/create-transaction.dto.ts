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
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @IsString()
  @IsNotEmpty({ message: 'Transaction type is required' })
  @IsIn(['INCOME', 'EXPENSE'], {
    message: 'Type must be either INCOME or EXPENSE',
  })
  type: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsDateString({}, { message: 'Invalid date format' })
  @IsOptional()
  date?: string;

  @IsUUID('4', { message: 'walletId must be a valid UUID' })
  @IsNotEmpty({ message: 'walletId is required' })
  walletId: string;

  @IsUUID('4', { message: 'categoryId must be a valid UUID' })
  @IsNotEmpty({ message: 'categoryId is required' })
  categoryId: string;
}
