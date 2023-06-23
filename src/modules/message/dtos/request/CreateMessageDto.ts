import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty()
  @IsString()
  readonly coversationId: string;

  @ApiProperty()
  @IsString()
  @Length(1, 500)
  readonly message: string;
}
