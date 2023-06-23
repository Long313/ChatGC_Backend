import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import paginate from 'mongoose-paginate-v2';

import { AbstractEntity } from '../../common/abstract.entity';
import type { LanguageDto } from './dtos/language.dto';

@Schema()
export class Language extends AbstractEntity<LanguageDto> {
  @Prop({ required: true, type: String, select: true })
  title: string;

  @Prop({ required: true, type: String, select: true })
  code: string;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const LanguageSchema = SchemaFactory.createForClass(Language);
LanguageSchema.plugin(paginate);
