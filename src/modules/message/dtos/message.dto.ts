import { ApiPropertyOptional } from '@nestjs/swagger';
import { Language } from 'common/dto/language.dto';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import type { Message } from '../message.entity';

export class MessageDto extends AbstractDto {
  @ApiPropertyOptional()
  guid: string;

  @ApiPropertyOptional()
  coversationId?: string;

  @ApiPropertyOptional()
  senderId: string;

  @ApiPropertyOptional()
  messageType: string;

  @ApiPropertyOptional()
  message: Language;

  constructor(message: Message) {
    super(message);

    this.coversationId = message._id.toString();
    this.senderId = message.senderId;
    this.message = message.message;
  }
}
