import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { languages } from 'common/constants';
import type { QueryParams } from 'common/dto/get-query.dto';
import type { Conversation } from 'modules/conversation/conversation.entity';
import { ConversationService } from 'modules/conversation/conversation.service';
import type { ClientSession } from 'mongoose';
import { PaginateModel } from 'mongoose';
import { TranslateService } from 'shared/services/translate.service';

import { MessageDto } from './dtos/message.dto';
import type { CreateMessageDto } from './dtos/request/CreateMessageDto';
import { Message } from './message.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: PaginateModel<Message>,

    @Inject(forwardRef(() => ConversationService))
    private conversationService: ConversationService,

    private translateService: TranslateService
  ) {}

  /**
   * Get all message by conversation id
   * @param userId
   * @param conversationId
   * @param query
   * @returns List of conversation
   */
  async getMessages(
    userId: string,
    conversationId: string,
    query: QueryParams
  ) {
    /**
     * Check permission
     * Only can get message in conversation participate in
     * Throw NotFoundException() if conversation is not existed
     */
    await this.conversationService.getConversation(userId, conversationId);

    return this.messageModel.paginate(
      { conversationId },
      {
        limit: query.limit || 50,
        page: query.page || 0,
        sort: { createdAt: -1 },
        populate: [
          { path: 'senderId', select: 'firstName lastName email langCode' },
        ],
      }
    );
  }

  /**
   * Get a message by id
   * @param userId
   * @param messageId
   * @returns
   */
  async getMessage(userId: string, messageId: string) {
    const message = await this.messageModel
      .findOne({ _id: messageId })
      .populate({
        path: 'conversationId',
        select: 'participants',
      })
      .populate({
        path: 'senderId',
        select: 'firstName lastName email langCode',
      });

    if (
      !message ||
      !(
        message.conversationId as unknown as Conversation
      ).participants.includes(userId)
    ) {
      throw new NotFoundException('Message is not existed');
    }

    return message;
  }

  /**
   * Create message
   * @param data
   * @return ConversationDto
   */
  async createMessage({
    langCode,
    senderId,
    data,
    session,
  }: {
    langCode?: string;
    senderId: string;
    data: CreateMessageDto;
    session: ClientSession;
  }) {
    const conversationId = data.coversationId;

    /**
     * Check permission
     * Only can send message in conversation participate in
     * Throw NotFoundException() if conversation is not existed
     */
    await this.conversationService.getConversation(senderId, conversationId);

    const checkLang = languages[`${langCode}`];

    if (!checkLang) {
      throw new BadRequestException();
    }

    // Create message
    const messageContent = {};
    messageContent[`${langCode}`] = data.message;
    const newMessage = new this.messageModel({
      conversationId,
      senderId,
      message: messageContent,
    });

    await newMessage.save({ session });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return new MessageDto(newMessage);
  }

  /**
   *  Add new translated text to message
   * @param {userId, messageId, langCode, text}
   * @returns
   */
  async addTranslatedMessage({
    userId,
    messageId,
    langCode,
    text,
  }: {
    userId: string;
    messageId: string;
    langCode: string;
    text: string;
  }) {
    // Throw NotFoundException() if message is not existed
    const message = await this.getMessage(userId, messageId);

    const checkLang = languages[`${langCode}`];

    if (!checkLang) {
      throw new BadRequestException();
    }

    const messageContent = {};
    messageContent[`${langCode}`] = text;

    return this.messageModel.findByIdAndUpdate(
      message._id,
      {
        message: { ...message.message, ...messageContent },
      },
      { new: true }
    );
  }

  /**
   * Translate a message text using  chat GPT
   * @param {userId, messageId, langCode, text}
   * @returns
   */
  async translateText({
    userId,
    messageId,
    langCode,
    text,
  }: {
    userId: string;
    messageId: string;
    langCode: string;
    text: string;
  }) {
    const checkLang = languages[`${langCode}`];

    if (!checkLang) {
      throw new BadRequestException();
    }

    // Translate message using GPT
    const translatedText = await this.translateService.translate(
      text,
      langCode
    );

    return this.addTranslatedMessage({
      userId,
      messageId,
      langCode,
      text: translatedText,
    });
  }
}
