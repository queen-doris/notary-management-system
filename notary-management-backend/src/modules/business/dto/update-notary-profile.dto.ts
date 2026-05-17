import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

/**
 * Minijust cover-letter profile. The notary fills these once; every
 * Minijust export reuses them so they only maintain a few fields.
 * District / sector / phone / email come from the business location.
 */
export class UpdateNotaryProfileDto {
  @ApiPropertyOptional({
    description: 'Notary full name as it appears on the letter',
    example: 'Me HABIMANA Adolphe',
  })
  @IsOptional()
  @IsString()
  notary_full_name?: string;

  @ApiPropertyOptional({
    description: 'Notary title',
    example: 'Noteri Wikorera',
  })
  @IsOptional()
  @IsString()
  notary_title?: string;

  @ApiPropertyOptional({
    description: 'Oath / swearing-in date ("Itariki yo Kurahira"), YYYY-MM-DD',
    example: '2019-10-03',
  })
  @IsOptional()
  @IsDateString()
  notary_oath_date?: string;

  @ApiPropertyOptional({
    description: 'Letter recipient block (defaults to the Minister of Justice)',
    example: "Nyakubahwa Minisitiri w'Ubutabera Ukaba n'Intumwa Nkuru ya Leta",
  })
  @IsOptional()
  @IsString()
  notary_letter_recipient?: string;
}
