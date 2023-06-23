import { IsString } from 'class-validator';

import { BaseSchema } from './BaseSchema';

export class JoinRoomSchema extends BaseSchema {
  @IsString()
  readonly event: 'join_room';
}
