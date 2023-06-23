import { Module } from '@nestjs/common';
import { AuthModule } from 'modules/auth/auth.module';
import { ConversationModule } from 'modules/conversation/conversation.module';
import { MessageModule } from 'modules/message/message.module';
import { UserModule } from 'modules/user/user.module';

import { ChatGateway } from './chat.gateway';

@Module({
  imports: [UserModule, AuthModule, ConversationModule, MessageModule],
  providers: [ChatGateway],
})
export class ChatModule {}
