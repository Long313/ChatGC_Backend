import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from 'modules/user/user.module';

import { ConversationController } from './conversation.controller';
import { Conversation, ConversationSchema } from './conversation.entity';
import { ConversationService } from './conversation.service';

@Module({
  controllers: [ConversationController],
  providers: [ConversationService],
  imports: [
    forwardRef(() => UserModule),
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
    ]),
  ],
  exports: [ConversationService],
})
export class ConversationModule {}
