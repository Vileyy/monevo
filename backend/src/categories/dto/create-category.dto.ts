import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Food' })
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  name: string;

  @ApiProperty({ example: 'EXPENSE', enum: ['INCOME', 'EXPENSE'] })
  @IsString()
  @IsNotEmpty({ message: 'Category type is required' })
  @IsIn(['INCOME', 'EXPENSE'], {
    message: 'Type must be either INCOME or EXPENSE',
  })
  type: string;

  @ApiPropertyOptional({ example: 'fork' })
  @IsString()
  @IsOptional()
  icon?: string;
}
