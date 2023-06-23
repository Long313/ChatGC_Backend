import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConversationService } from 'modules/conversation/conversation.service';
import { UserService } from 'modules/user/user.service';

import type { BaseSchema } from '../schema/BaseSchema';

@Injectable()
export class ChatPoliciesGuard<CtxData extends BaseSchema>
  implements CanActivate
{
  constructor(
    private conversationService: ConversationService,
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  /**
   * Check if user is able to join or send messages in the conversation
   * @param context
   * @returns
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToWs();
    const data = ctx.getData<CtxData>();
    const client = ctx.getClient();

    let claims;

    try {
      const token = client.handshake.auth.token as string;
      claims = await this.jwtService.verifyAsync(token);
    } catch {
      throw new ForbiddenException();
    }

    const userId: string = claims.userId;

    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new ForbiddenException();
    }

    const conversation = await this.conversationService.getConversation(
      userId,
      data.conversationId
    );

    client.handshake.sender = {
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      langCode: user.langCode,
      userName: user.userName,
    };

    client.handshake.conversation = conversation;

    return true;
  }
}
