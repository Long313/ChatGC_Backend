import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Connection } from 'mongoose';

import { Auth, AuthUser } from '../../decorators';
import { SearchUserDto } from './dtos/request/SearchUserDto';
import { UserUpdateDto } from './dtos/request/UserUpdateDto';
import { UserDto } from './dtos/user.dto';
import { UserService } from './user.service';

@Controller('users')
@ApiTags('users')
export class UserController {
  constructor(
    private userService: UserService,
    @InjectConnection() private readonly mongoConnection: Connection
  ) {}

  @Get(':id')
  @Auth([])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User',
    type: UserDto,
  })
  getUser(@Param('id') userId: string): Promise<UserDto> {
    return this.userService.getUser(userId);
  }

  /**
   * update user information login
   * @param user user login
   * @param userUpdateDto user informatiion update
   * @returns user information after update
   */
  @Put('')
  @Auth([])
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @AuthUser() user: UserDto,
    @Body() userUpdateDto: UserUpdateDto
  ): Promise<UserDto> {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();

    try {
      const response = await this.userService.updateUser(
        user._id,
        userUpdateDto
      );
      await session.commitTransaction();

      return response;
    } catch (error) {
      await session.abortTransaction();

      throw new BadRequestException(error);
    }
  }

  /**
   * Add another user as a contact
   * @param user User login
   * @param userIdContact Id of another user
   * @returns User login information
   */
  @Post('/contact/add/:id')
  @Auth([])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: ' users list',
    type: UserDto,
  })
  async addUserContact(
    @AuthUser() user: UserDto,
    @Param('id') userIdContact: string
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();

    try {
      const response = await this.userService.addAnotherUserAsContact(
        user._id,
        userIdContact,
        session
      );
      await session.commitTransaction();

      return response;
    } catch (error) {
      await session.abortTransaction();

      throw new BadRequestException(error);
    }
  }

  /**
   * Get contact list by user id
   * @param userId Id of user
   * @returns Contact list
   */
  @Get('/:id/contacts')
  @Auth([])
  @HttpCode(HttpStatus.OK)
  async getUserContacts(@Param('id') userId: string) {
    try {
      return await this.userService.getUserContactList(userId);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  /**
   * Get contact request list by user id
   * @param userId Id of user
   * @returns Contact list
   */
  @Get('/:id/contactRequests')
  @Auth([])
  @HttpCode(HttpStatus.OK)
  async getUserContactRequests(@Param('id') _userId: string) {
    try {
      return await this.userService.getUserContactRequests(_userId);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  /**
   * Search user by userName and email (with pagination)
   * @param SearchUserDto
   * @returns
   */
  @Post('search')
  @Auth([])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: UserDto,
    description: 'List of users (firstName, lastName, email, userName)',
    isArray: true,
  })
  searchUser(@Body() data: SearchUserDto) {
    return this.userService.searchUser(data);
  }
}
