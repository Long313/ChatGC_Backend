import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationModule } from 'modules/conversation/conversation.module';

import { MessageController } from './message.controller';
import { Message, MessageSchema } from './message.entity';
import { MessageService } from './message.service';

@Module({
  controllers: [MessageController],
  providers: [MessageService],
  imports: [
    ConversationModule,
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
  ],
  exports: [MessageService],
})
export class MessageModule {}
