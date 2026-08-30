import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryBudgetDto {
  @ApiPropertyOptional({
    example: 8,
    minimum: 1,
    maximum: 12,
    description: 'Month (1-12)',
  })
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  @Type(() => Number)
  month?: number;

  @ApiPropertyOptional({ example: 2026, description: 'Year' })
  @IsInt()
  @Min(2020)
  @IsOptional()
  @Type(() => Number)
  year?: number;
}
