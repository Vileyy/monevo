import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateBudgetDto {
  @ApiPropertyOptional({ example: 2500000, description: 'Budget limit amount' })
  @IsNumber()
  @IsPositive({ message: 'Budget amount must be greater than 0' })
  @IsOptional()
  @Type(() => Number)
  amount?: number;
}
