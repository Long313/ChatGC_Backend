import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddUserDto {
  @IsString({
    each: true,
  })
  @ApiProperty()
  readonly participantsId: string[];
}
