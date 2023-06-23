import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

import { AbstractEntity } from '../../common/abstract.entity';
import { RoleType } from '../../constants';
import type { UserDto } from './dtos/user.dto';

@Schema()
export class User extends AbstractEntity<UserDto> {
  @Prop({ required: true, type: String })
  phone: string;

  @Prop({ required: true, unique: true, type: String })
  email: string;

  @Prop({ required: true, type: String })
  password: string;

  @Prop({ required: true, type: String })
  firstName: string;

  @Prop({ required: true, type: String })
  lastName: string;

  @Prop({ type: String })
  preferences: string;

  @Prop({ required: true, type: String })
  role: RoleType;

  @Prop({ required: true, type: Boolean })
  refreshTokenRevoke: boolean;

  @Prop({ required: true, unique: true, type: String })
  userName: string;

  @Prop({
    required: true,
    type: String,
    maxlength: 2,
  })
  langCode: string;

  // user contact
  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
      },
    ],
    default: [],
  })
  @Type(() => User)
  contact: string[];

  // user contact request
  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
      },
    ],
    default: [],
  })
  @Type(() => User)
  contactRequest: string[];
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.set('autoIndex', true);
UserSchema.plugin(paginate);

UserSchema.pre(
  ['findOne', 'findOneAndUpdate', 'find'],

  function (next: () => void) {
    // eslint-disable-next-line no-invalid-this
    void this.where({ isDeleted: false });
    next();
  }
);
