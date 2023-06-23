import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import type { Constructor } from '../types';
import type { AbstractDto } from './dto/abstract.dto';

@Schema()
export abstract class AbstractEntity<
  DTO extends AbstractDto = AbstractDto,
  O = never
> extends Document {
  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: false })
  isDeleted: boolean;

  private dtoClass?: Constructor<DTO, [AbstractEntity, O?]>;
}
