import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @ApiProperty()
  readonly title: string;

  @IsString({
    each: true,
  })
  @ApiProperty()
  readonly participantsId?: string[];
}
