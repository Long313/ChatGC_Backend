import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserDto } from 'modules/user/dtos/user.dto';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import type { Conversation } from '../conversation.entity';

export class ConversationDto extends AbstractDto {
  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  chanelId?: string;

  @ApiPropertyOptional()
  creator?: UserDto;

  @ApiPropertyOptional()
  participants?: UserDto[];

  constructor(conversation: Conversation) {
    super(conversation);
    this.title = conversation.title;
  }
}
