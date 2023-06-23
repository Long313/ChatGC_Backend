import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LanguageController } from './language.controller';
import { Language, LanguageSchema } from './language.entity';
import { LanguageService } from './language.service';

@Module({
  controllers: [LanguageController],
  providers: [LanguageService],
  imports: [
    MongooseModule.forFeature([
      { name: Language.name, schema: LanguageSchema },
    ]),
  ],
  exports: [LanguageService],
})
export class LanguageModule {}
