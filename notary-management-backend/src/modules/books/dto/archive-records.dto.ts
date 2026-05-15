import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsBoolean, IsUUID } from 'class-validator';

export class ArchiveRecordsDto {
  @ApiProperty({
    description: 'Archive records served before this date (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsDateString()
  before_date: string;

  @ApiPropertyOptional({
    description: 'Limit archiving to a single book (UUID)',
  })
  @IsOptional()
  @IsUUID()
  book_id?: string;

  @ApiPropertyOptional({
    description: 'Must be true to actually perform the archive',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  confirm?: boolean = false;
}

export class ArchiveRecordsResponseDto {
  @ApiProperty() message: string;
  @ApiProperty() archived_count: number;
  @ApiPropertyOptional() book_id?: string;
  @ApiProperty() before_date: string;
}
