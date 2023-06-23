import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatModule } from 'modules/chat/chat.module';
import { ConversationModule } from 'modules/conversation/conversation.module';
import { MessageModule } from 'modules/message/message.module';
import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

import { AuthModule } from './modules/auth/auth.module';
import { HealthCheckerModule } from './modules/health-checker/health-checker.module';
import { UserModule } from './modules/user/user.module';
import { ApiConfigService } from './shared/services/api-config.service';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    SharedModule,
    AuthModule,
    UserModule,
    ConversationModule,
    MessageModule,
    ChatModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      inject: [ApiConfigService],
      // eslint-disable-next-line @typescript-eslint/require-await
      useFactory: async (configService: ApiConfigService) => {
        mongoose.plugin(paginate);

        return configService.mongoConfig;
      },
    }),

    HealthCheckerModule,
  ],
  providers: [],
})
export class AppModule {}
