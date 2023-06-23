import { IsString } from 'class-validator';

export class BaseSchema {
  @IsString()
  readonly conversationId: string;

  @IsString()
  readonly event: string;
}
