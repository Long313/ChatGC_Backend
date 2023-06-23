import { ApiPropertyOptional } from '@nestjs/swagger';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import type { Language } from '../language.entity';

export class LanguageDto extends AbstractDto {
  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  code?: string;

  constructor(language: Language) {
    super(language);
    this.title = language.title;
    this.code = language.code;
  }
}
