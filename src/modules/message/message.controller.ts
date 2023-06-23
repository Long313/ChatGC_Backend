import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { QueryParams } from 'common/dto/get-query.dto';
import { Auth, AuthUser } from 'decorators';
import { UserDto } from 'modules/user/dtos/user.dto';
import { Connection } from 'mongoose';

import { MessageDto } from './dtos/message.dto';
import { CreateMessageDto } from './dtos/request/CreateMessageDto';
import { TranslateMessageDto } from './dtos/request/TranslateMessageDto';
import { MessageService } from './message.service';

@Controller('messages')
@ApiTags('messages')
export class MessageController {
  constructor(
    private messageService: MessageService,
    @InjectConnection() private readonly mongoConnection: Connection
  ) {}

  /**
   * Get all messages by coversation id
   * @param user
   * @param createData
   * @returns Message
   */
  @Post('/search/conversation/:id')
  @Auth([])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Create new message',
    type: MessageDto,
    isArray: true,
  })
  async getMessages(
    @AuthUser() user: UserDto,
    @Param('id') _id: string,
    @Body() query: QueryParams
  ) {
    return this.messageService.getMessages(user._id, _id, query);
  }

  /**
   * Get message by id
   * @param user
   * @param createData
   * @returns Message
   */
  @Get('/:id')
  @Auth([])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Create new message',
    type: MessageDto,
  })
  async getMessage(@AuthUser() user: UserDto, @Param('id') _id: string) {
    return this.messageService.getMessage(user._id, _id);
  }

  /**
   * Create new message
   * @param user
   * @param createData
   * @returns Message
   */
  @Post('')
  @Auth([])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Create new message',
    type: MessageDto,
  })
  async createMessage(
    @AuthUser() user: UserDto,
    @Body() createData: CreateMessageDto
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();

    try {
      const data = await this.messageService.createMessage({
        langCode: user.langCode,
        senderId: user._id,
        data: createData,
        session,
      });
      await session.commitTransaction();

      return data;
    } catch {
      await session.abortTransaction();

      throw new BadRequestException();
    }
  }

  /**
   * Translate a message text
   * @param user
   * @param messageId
   * @param data
   * @returns
   */
  @Post('/:id/translate')
  @Auth([])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Create new message',
    type: MessageDto,
  })
  async translateText(
    @AuthUser() user: UserDto,
    @Param('id') messageId: string,
    @Body() data: TranslateMessageDto
  ) {
    return this.messageService.translateText({
      userId: user._id,
      langCode: data.langCode,
      text: data.text,
      messageId,
    });
  }
}
