/* eslint-disable @typescript-eslint/naming-convention */
import type {
  ExtractSubjectType,
  InferSubjects,
  MongoAbility,
} from '@casl/ability';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { ChatAction } from 'common/constants';
import { Conversation } from 'modules/conversation/conversation.entity';
import type { User } from 'modules/user/user.entity';

type Subjects = InferSubjects<typeof Conversation | typeof User> | 'all';
export type AppAbility = MongoAbility<[ChatAction, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    can(ChatAction.Message, Conversation, {
      participants: { $elemMatch: { $eq: user._id } },
    });

    can(ChatAction.Join, Conversation, {
      participants: { $elemMatch: { $eq: user._id } },
    });

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
