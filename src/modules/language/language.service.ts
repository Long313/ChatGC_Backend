import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';

import { LanguageDto } from './dtos/language.dto';
import type { CreateLanguageDto } from './dtos/request/create-dto';
import { Language } from './language.entity';

@Injectable()
export class LanguageService {
  constructor(
    @InjectModel(Language.name)
    private readonly languageModel: PaginateModel<Language>
  ) {}

  /**
   * Create new language
   * @param data
   * @return LanguageDto
   */
  async createLanguage(data: CreateLanguageDto): Promise<LanguageDto> {
    const newLanguage = new this.languageModel({
      title: data.title,
      code: data.code,
    });

    await newLanguage.save();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return new LanguageDto(newLanguage);
  }
}
