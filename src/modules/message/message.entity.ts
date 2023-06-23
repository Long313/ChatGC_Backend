import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import { Language } from 'common/dto/language.dto';
import { Conversation } from 'modules/conversation/conversation.entity';
import { User } from 'modules/user/user.entity';
import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

import { AbstractEntity } from '../../common/abstract.entity';
import type { MessageDto } from './dtos/message.dto';

@Schema()
export class Message extends AbstractEntity<MessageDto> {
  @Prop({ required: false, type: String, default: '' })
  guid: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    select: true,
  })
  @Type(() => User)
  senderId: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    select: true,
  })
  @Type(() => Conversation)
  conversationId: string;

  @Prop({ required: true, type: Language, select: true })
  @Type(() => Language)
  message: Language;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.plugin(paginate);

MessageSchema.pre(
  ['findOne', 'findOneAndUpdate', 'find'],

  function (next: () => void) {
    // eslint-disable-next-line no-invalid-this
    void this.where({ isDeleted: false });
    next();
  }
);
