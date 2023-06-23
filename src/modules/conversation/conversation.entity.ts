/* eslint-disable no-invalid-this */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import { User } from 'modules/user/user.entity';
import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

import { AbstractEntity } from '../../common/abstract.entity';
import type { ConversationDto } from './dtos/conversation.dto';

@Schema()
export class Conversation extends AbstractEntity<ConversationDto> {
  @Prop({ required: true, type: String, select: true })
  title: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    select: true,
  })
  @Type(() => User)
  creatorId: string;

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        select: true,
      },
    ],
  })
  @Type(() => User)
  participants: string[];
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.plugin(paginate);

ConversationSchema.pre(
  ['findOne', 'findOneAndUpdate', 'find'],

  function (next: () => void) {
    void this.where({ isDeleted: false });
    next();
  }
);
