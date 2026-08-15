import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateWalletDto {
  @IsString()
  @IsNotEmpty({ message: 'Wallet name is required' })
  name: string;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Initial balance cannot be negative' })
  balance?: number;

  @IsString()
  @IsNotEmpty({ message: 'Wallet type is required' })
  type: string; // e.g., "CASH", "BANK", "CREDIT_CARD"
}
