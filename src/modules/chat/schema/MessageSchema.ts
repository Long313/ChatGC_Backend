import { IsOptional, IsString, Length } from 'class-validator';

import { BaseSchema } from './BaseSchema';

export class MessageSchema extends BaseSchema {
  @IsString()
  @Length(1, 500)
  readonly content: string;

  @IsString()
  readonly event: 'chat';

  @IsString()
  @IsOptional()
  readonly attachmentsUrl?: string[];
}
