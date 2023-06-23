import {
  // BadRequestException,
  // Body,
  Controller,
  // HttpCode,
  // HttpStatus,
  // Post,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiTags } from '@nestjs/swagger';
// import { QueryParams } from 'common/dto/get-query.dto';
// import { Auth, AuthUser } from 'decorators';
// import { UserDto } from 'modules/user/dtos/user.dto';
import { Connection } from 'mongoose';

// import { CreateLanguageDto } from './dtos/request/create-dto';
import { LanguageService } from './language.service';

@Controller('languages')
@ApiTags('languages')
export class LanguageController {
  constructor(
    private languageSerive: LanguageService,
    @InjectConnection() private readonly mongoConnection: Connection
  ) {}
}
