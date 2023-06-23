import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { QueryParams } from 'common/dto/get-query.dto';
import type { ClientSession } from 'mongoose';
import { PaginateModel } from 'mongoose';

import { UserService } from '../user/user.service';
import { Conversation } from './conversation.entity';
import { ConversationDto } from './dtos/conversation.dto';
import type { CreateConversationDto } from './dtos/request/CreateConversationDto';

@Injectable()
export class ConversationService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: PaginateModel<Conversation>,
    private userService: UserService
  ) {}

  /**
   * Create new conversation
   * @param data
   * @return ConversationDto
   */
  async createConversation(
    userId: string,
    data: CreateConversationDto,
    session: ClientSession
  ): Promise<ConversationDto> {
    const newConversation = new this.conversationModel({
      title: data.title,
      creatorId: userId,
      participants: data.participantsId
        ? [...data.participantsId, userId]
        : userId,
    });

    await newConversation.save({ session });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return new ConversationDto(newConversation);
  }

  /**
   * Get all conversations
   * @param userId
   * @param query
   * @returns List of conversation
   */
  async getConversations(userId: string, query: QueryParams) {
    const find: Record<string, unknown> = { participants: { $all: [userId] } };

    if (query.q?.keyword) {
      find.title = { $regex: query.q.keyword, $options: 'i' };
    }

    return this.conversationModel.paginate(find, {
      limit: query.limit || 50,
      page: query.page || 0,
      sort: { createdAt: -1 },
      populate: [
        { path: 'participants', select: 'firstName lastName email langCode' },
      ],
    });
  }

  /**
   * Get a conversation by id
   * @param userId current login user id
   * @param id conversation id
   * @returns Conversation
   */
  async getConversation(
    userId: string,
    id: string
  ): Promise<Conversation | null> {
    const conversation = await this.conversationModel
      .findOne({
        _id: id,
        participants: { $all: [userId] },
      })
      .populate({
        path: 'participants',
        select: 'firstName lastName email langCode',
      });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  /**
   *  Delete Conversation -> update isDeleted = false and updateAt = date now
   * @param userId Id of current login user
   * @param groupId Id of Conversation delete
   * @returns Conversation information be deleted
   */
  async deleteConversation(
    userId: string,
    groupId: string,
    session: ClientSession
  ) {
    const conversation = await this.conversationModel.find({
      _id: groupId,
      creatorId: userId,
    });

    if (conversation.length <= 0) {
      throw new NotFoundException('Conversation not found');
    }

    return this.conversationModel
      .findByIdAndUpdate(
        { _id: groupId },
        { isDeleted: true, updatedAt: Date.now() }
      )
      .setOptions({ overwrite: true, new: true, session });
  }

  /**
   * Add user to conversation by update column participant
   * @param userId Id of Login User
   * @param conversationId Id of conversation
   * @param participantIds Array user id be add conversation
   * @param session
   * @returns Conversation information have new participant
   */
  async addUsersToConversation(
    userId: string,
    conversationId: string,
    participantIds: string[],
    session: ClientSession
  ) {
    const conversations = await this.conversationModel.find({
      _id: conversationId,
      creatorId: userId,
    });

    if (conversations.length <= 0) {
      throw new NotFoundException('Conversation not found');
    }

    const user = await this.userService.findOne(userId, true);

    if (!user) {
      throw new NotFoundException('User login not found');
    }

    const userContacts = user.contact;
    const conversation = conversations[0];
    const conversationParticipant = conversation.participants;

    // check user are not in conversation
    const userNotInConversation = participantIds.filter(
      (userIdItem) => !conversationParticipant.includes(userIdItem)
    );

    if (userNotInConversation.length <= 0) {
      throw new BadRequestException('All user joined conversation');
    }

    // check user id are contact
    const userInContact = userNotInConversation.filter((userIdItem) =>
      userContacts.includes(userIdItem)
    );

    if (userInContact.length <= 0) {
      throw new NotFoundException('User are not contact');
    }

    // merge array conversation member check duplicate
    const newConversationParticipant = [
      ...conversationParticipant,
      ...userInContact,
    ];

    return this.conversationModel
      .findByIdAndUpdate(
        { _id: conversationId },
        { participants: newConversationParticipant }
      )
      .setOptions({ overwrite: true, new: true, session });
  }

  /**
   * Remove a user from conversation by update column participant
   * @param userId Id of Login User
   * @param conversationId Id of conversation
   * @param removeUserId Id of user to remove
   * @param session
   * @returns Conversation information with new participant
   */
  async removeUserFromConversation(
    creatorId: string,
    conversationId: string,
    removeUserId: string,
    session: ClientSession
  ) {
    const conversationUpdated = await this.conversationModel
      .findOneAndUpdate(
        { creatorId, _id: conversationId },
        {
          $pull: { participants: removeUserId },
        }
      )
      .setOptions({ new: true, session });

    if (!conversationUpdated) {
      throw new NotFoundException(
        'This conversation is not deleted or you dont have permission to delete it'
      );
    }

    return conversationUpdated;
  }

  /**
   * Remove a user from conversation by update column participant
   * @param memberId Id of Login User
   * @param conversationId Id of conversation
   * @param session
   * @returns Conversation information with new participant
   */
  async memberLeave(memberId: string, groupId: string, session: ClientSession) {
    const conversationUpdated = await this.conversationModel
      .findOneAndUpdate(
        {
          _id: groupId,
          creatorId: { $ne: memberId },
          participants: { $in: [memberId] },
        },
        {
          $pull: { participants: memberId },
        }
      )
      .setOptions({ new: true, session });

    if (!conversationUpdated) {
      throw new NotFoundException('Can not leave conversation');
    }

    return conversationUpdated;
  }
}
