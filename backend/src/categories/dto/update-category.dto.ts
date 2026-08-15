import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @IsIn(['INCOME', 'EXPENSE'], {
    message: 'Type must be either INCOME or EXPENSE',
  })
  type?: string;

  @IsString()
  @IsOptional()
  icon?: string;
}
