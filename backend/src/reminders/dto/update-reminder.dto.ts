import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class UpdateReminderDto {
  @ApiPropertyOptional({ example: 'Tiền thuốc tim' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 400000 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({ example: 15, minimum: 1, maximum: 31 })
  @IsInt()
  @Min(1)
  @Max(31)
  @IsOptional()
  @Type(() => Number)
  dueDate?: number;

  @ApiPropertyOptional({ example: 'MONTHLY' })
  @IsString()
  @IsOptional()
  frequency?: string;

  @ApiPropertyOptional({ example: 'MEDICINE' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID('4')
  @IsOptional()
  walletId?: string;
}
