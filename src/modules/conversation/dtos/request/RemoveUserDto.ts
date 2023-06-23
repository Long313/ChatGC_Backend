import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RemoveUserDto {
  @IsString()
  @ApiProperty()
  readonly participantId: string;
}
