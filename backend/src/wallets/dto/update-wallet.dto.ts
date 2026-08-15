import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateWalletDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Balance cannot be negative' })
  balance?: number;

  @IsString()
  @IsOptional()
  type?: string;
}
