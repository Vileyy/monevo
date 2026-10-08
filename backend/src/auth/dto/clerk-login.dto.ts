import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ClerkLoginDto {
  @ApiProperty({
    description: 'Clerk session JWT token',
  })
  @IsString()
  @IsNotEmpty()
  clerkToken: string;
}
