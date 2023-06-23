import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class TranslateMessageDto {
  @ApiProperty()
  @IsString()
  @Length(1, 500)
  readonly text: string;

  @ApiProperty()
  @IsString()
  @Length(1, 2)
  readonly langCode: string;
}
