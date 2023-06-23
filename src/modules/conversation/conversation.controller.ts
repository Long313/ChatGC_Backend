import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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

import { ConversationService } from './conversation.service';
import { ConversationDto } from './dtos/conversation.dto';
import { AddUserDto } from './dtos/request/AddUserDto';
import { CreateConversationDto } from './dtos/request/CreateConversationDto';
import { RemoveUserDto } from './dtos/request/RemoveUserDto';

@Controller('conversations')
@ApiTags('conversations')
export class ConversationController {
  constructor(
    private conversationSerive: ConversationService,
    @InjectConnection() private readonly mongoConnection: Connection
  ) {}

  @Post('')
  @Auth([])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation',
    type: ConversationDto,
  })
  async createConversation(
    @AuthUser() user: UserDto,
    @Body() createData: CreateConversationDto
  ): Promise<ConversationDto> {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();

    try {
      const data = await this.conversationSerive.createConversation(
        user._id,
        createData,
        session
      );
      await session.commitTransaction();

      return data;
    } catch {
      await session.abortTransaction();

      throw new BadRequestException();
    }
  }

  /**
   * Get all conversation of current user
   * @param user Current login user
   * @param query Query for search
   * @returns List of conversations
   */
  @Post('/search')
  @Auth([])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation',
    type: ConversationDto,
    isArray: true,
  })
  async getConversations(
    @AuthUser() user: UserDto,
    @Body() query: QueryParams
  ) {
    return this.conversationSerive.getConversations(user._id, query);
  }

  /**
   * Get a conversation by id
   * @param user Current login user
   * @param _id Conversation Id
   * @returns List of conversations
   */
  @Get('/:id')
  @Auth([])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation',
    type: ConversationDto,
    isArray: true,
  })
  async getConversation(@AuthUser() user: UserDto, @Param('id') _id: string) {
    return this.conversationSerive.getConversation(user._id, _id);
  }

  /**
   * Delete Conversation of current user
   * @param user Current login user
   * @param groupId Id of Conversation delete
   * @returns Conversation information be deleted
   */
  @Delete(':id')
  @Auth([])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delete Conversation',
    type: ConversationDto,
  })
  async deleteConversation(
    @AuthUser() user: UserDto,
    @Param('id') groupId: string
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();

    try {
      const data = await this.conversationSerive.deleteConversation(
        user._id,
        groupId,
        session
      );

      await session.commitTransaction();

      return data;
    } catch (error) {
      await session.abortTransaction();

      throw error;
    }
  }

  /**
   * Remove a user from conversation
   * @param user Login user
   * @param conversationId Id of conversation
   * @param participants Array userId add to conversation
   * @returns Conversation information
   */
  @Post(':id/remove')
  @Auth([])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation',
    type: ConversationDto,
  })
  async removeConversationParticipant(
    @AuthUser() user: UserDto,
    @Param('id') conversationId: string,
    @Body() removeData: RemoveUserDto
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();

    try {
      const data = await this.conversationSerive.removeUserFromConversation(
        user._id,
        conversationId,
        removeData.participantId,
        session
      );

      await session.commitTransaction();

      return data;
    } catch (error) {
      await session.abortTransaction();

      throw new BadRequestException(error);
    }
  }

  /**
   * Add many user to conversation
   * @param user Login user
   * @param conversationId Id of conversation
   * @param participants Array userId add to conversation
   * @returns Conversation information
   */
  @Post(':id/add')
  @Auth([])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation',
    type: ConversationDto,
  })
  async addConversationParticipant(
    @AuthUser() user: UserDto,
    @Param('id') conversationId: string,
    @Body() addData: AddUserDto
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();

    try {
      const data = await this.conversationSerive.addUsersToConversation(
        user._id,
        conversationId,
        addData.participantsId,
        session
      );

      await session.commitTransaction();

      return data;
    } catch (error) {
      await session.abortTransaction();

      throw new BadRequestException(error);
    }
  }

  /**
   * Member leave group
   * @param user Current login user
   * @param groupId Id of Conversation delete
   * @returns Member leave group
   */
  @Delete(':id/member')
  @Auth([])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Member leave group',
    type: ConversationDto,
  })
  async memberLeave(@AuthUser() user: UserDto, @Param('id') groupId: string) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();

    try {
      const data = await this.conversationSerive.memberLeave(
        user._id,
        groupId,
        session
      );

      await session.commitTransaction();

      return data;
    } catch (error) {
      await session.abortTransaction();

      throw error;
    }
  }
}
