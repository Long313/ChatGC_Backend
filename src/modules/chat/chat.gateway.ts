/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable unicorn/no-array-for-each */
import { Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type {
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import _ from 'lodash';
import type { ConversationDto } from 'modules/conversation/dtos/conversation.dto';
import { MessageService } from 'modules/message/message.service';
import type { UserDto } from 'modules/user/dtos/user.dto';
import { Connection } from 'mongoose';
import { TranslateService } from 'shared/services/translate.service';
import { Server, Socket } from 'socket.io';

import { ChatPoliciesGuard } from './guards/chat.guard';
import { JoinRoomSchema } from './schema/JoinRoomSchema';
import { MessageSchema } from './schema/MessageSchema';
@WebSocketGateway(81, { transports: ['websocket'] })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private messageService: MessageService,
    private translateService: TranslateService,
    @InjectConnection() private readonly mongoConnection: Connection
  ) {}

  @WebSocketServer() server: Server = new Server();

  private logger = new Logger('ChatGateway');

  /**
   * Handle sending message
   * @param payload
   * @param client
   * @returns
   */
  @UseGuards(ChatPoliciesGuard<MessageSchema>)
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('chat')
  async handleChatEvent(
    @MessageBody()
    payload: MessageSchema,
    @ConnectedSocket() client: Socket
  ): Promise<boolean> {
    const sender: UserDto = (client.handshake as any).sender;
    const senderLangCode = sender.langCode;
    this.logger.log(`${sender.firstName} is sending message`);

    const conversation: ConversationDto = (client.handshake as any)
      .conversation;

    /**
     * Todo handle message
     * 1. Save original message to database
     * 2. Emit message to the room
     * 3. Translate the message using Chat GPT Service
     * 4. Update translated message to database
     * 5. Emit translated message to the room
     */

    // Save sender's original message to database
    const session = await this.mongoConnection.startSession();
    session.startTransaction();

    let orgMessage;

    try {
      orgMessage = await this.messageService.createMessage({
        langCode: senderLangCode,
        senderId: sender._id,
        session,
        data: {
          coversationId: payload.conversationId,
          message: payload.content,
        },
      });
      await session.commitTransaction();
    } catch {
      await session.abortTransaction();
    }

    // Emit original message
    this.server.to(payload.conversationId).emit('chat', {
      ...orgMessage,
      senderId: sender,
    });

    // Handle translate
    try {
      // Get users language in this conversation
      const totalLangues = conversation.participants?.map(
        (user) => user.langCode
      );

      // Set translation language (except sender language)
      const translationsLang = _.xor([senderLangCode], totalLangues);

      translationsLang.forEach(async (langCode) => {
        try {
          const translatedText = await this.translateService.translate(
            payload.content,
            langCode
          );

          // Update translate text
          const translatedMessage =
            await this.messageService.addTranslatedMessage({
              userId: sender._id,
              langCode,
              text: translatedText,
              messageId: orgMessage._id,
            });

          if (translatedMessage) {
            // Emit translated message to client
            this.server.to(payload.conversationId).emit('chat', {
              type: 'translated',
              translatedText,
              _id: translatedMessage._id,
              langCode,
              senderId: sender,
            });
          }
        } catch {
          return '';
        }
      });
    } catch (error) {
      this.logger.log(error);
    }

    // Translate

    return true;
  }

  /**
   * Handle on joining conversation
   * @param payload
   * @param client
   * @returns
   */
  @UseGuards(ChatPoliciesGuard<JoinRoomSchema>)
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('join_room')
  handleSetClientDataEvent(
    @MessageBody()
    payload: JoinRoomSchema,
    @ConnectedSocket() client: Socket
  ): boolean {
    const sender: UserDto = (client.handshake as any).sender;

    this.logger.log(
      `${client.id} ${sender.firstName}  is joining ${payload.conversationId}`
    );

    this.server.in(client.id).socketsJoin(payload.conversationId);

    return true;
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`Socket connected: ${client.id}`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    // ToDo
    this.logger.log(`Socket disconected: ${client.id}`);
  }
}
