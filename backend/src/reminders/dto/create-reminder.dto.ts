import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateReminderDto {
  @ApiProperty({
    example: 'Tiền thuốc huyết áp',
    description: 'Reminder title',
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @ApiProperty({ example: 350000, description: 'Amount to pay' })
  @IsNumber()
  @IsPositive({ message: 'Amount must be greater than 0' })
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    example: 10,
    minimum: 1,
    maximum: 31,
    description: 'Day of month (1-31)',
  })
  @IsInt()
  @Min(1, { message: 'Due date must be between 1 and 31' })
  @Max(31, { message: 'Due date must be between 1 and 31' })
  @Type(() => Number)
  dueDate: number;

  @ApiPropertyOptional({
    example: 'MONTHLY',
    enum: ['MONTHLY', 'WEEKLY', 'ONE_TIME'],
  })
  @IsString()
  @IsOptional()
  frequency?: string;

  @ApiPropertyOptional({
    example: 'MEDICINE',
    enum: ['MEDICINE', 'ELECTRICITY', 'WATER', 'RENT', 'INTERNET', 'OTHER'],
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Preferred wallet ID to pay from',
  })
  @IsUUID('4', { message: 'walletId must be a valid UUID' })
  @IsOptional()
  walletId?: string;
}
