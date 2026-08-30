import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class PayReminderDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Wallet to pay from (defaults to reminder wallet)',
  })
  @IsUUID('4')
  @IsOptional()
  walletId?: string;
}
