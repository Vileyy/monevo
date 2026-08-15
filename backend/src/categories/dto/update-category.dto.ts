import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Food' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'EXPENSE', enum: ['INCOME', 'EXPENSE'] })
  @IsString()
  @IsOptional()
  @IsIn(['INCOME', 'EXPENSE'], {
    message: 'Type must be either INCOME or EXPENSE',
  })
  type?: string;

  @ApiPropertyOptional({ example: 'fork' })
  @IsString()
  @IsOptional()
  icon?: string;
}
