import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateWalletDto {
  @ApiPropertyOptional({ example: 'Cash' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Balance cannot be negative' })
  balance?: number;

  @ApiPropertyOptional({
    example: 'CASH',
    enum: ['CASH', 'BANK', 'CREDIT_CARD'],
  })
  @IsString()
  @IsOptional()
  type?: string;
}
