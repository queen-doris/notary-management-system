import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SelectBusinessDto {
  @ApiProperty({
    description:
      'UUID of the business to activate for this session (returns a new token scoped to it)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  businessId: string;
}
