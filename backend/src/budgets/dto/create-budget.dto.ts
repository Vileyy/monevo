import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateBudgetDto {
  @ApiProperty({ example: 2000000, description: 'Budget limit amount' })
  @IsNumber()
  @IsPositive({ message: 'Budget amount must be greater than 0' })
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    example: 8,
    minimum: 1,
    maximum: 12,
    description: 'Month (1-12)',
  })
  @IsInt()
  @Min(1, { message: 'Month must be between 1 and 12' })
  @Max(12, { message: 'Month must be between 1 and 12' })
  @Type(() => Number)
  month: number;

  @ApiProperty({ example: 2026, description: 'Year (e.g. 2026)' })
  @IsInt()
  @Min(2020, { message: 'Year must be 2020 or later' })
  @Type(() => Number)
  year: number;

  @ApiProperty({ format: 'uuid', description: 'Category ID' })
  @IsUUID('4', { message: 'categoryId must be a valid UUID' })
  @IsNotEmpty({ message: 'categoryId is required' })
  categoryId: string;
}
