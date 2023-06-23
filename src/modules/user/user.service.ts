import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { generateHash } from 'common/utils';
import type { UserRegisterDto } from 'modules/auth/dto/request/UserRegisterDto';
import type { ClientSession } from 'mongoose';
import { PaginateModel } from 'mongoose';

import type { SearchUserDto } from './dtos/request/SearchUserDto';
import type { UserUpdateDto } from './dtos/request/UserUpdateDto';
import { UserDto } from './dtos/user.dto';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: PaginateModel<User>
  ) {}

  /**
   * Custom findOne function
   * @param id
   * @param isValidRefreshToken
   * @param selectFields
   * @returns
   */
  async findOne(
    id: string,
    isValidRefreshToken?: boolean,
    selectFields?: string
  ): Promise<User | null> {
    let user;
    let query: Record<string, unknown> = { _id: id };

    if (isValidRefreshToken) {
      query = { ...query, refreshTokenRevoke: false };
    }

    try {
      user = await this.userModel
        .findOne(
          query,
          selectFields ||
            'userName email firstName lastName userName contact contactRequest langCode'
        )
        .select('password role')
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }

    return user;
  }

  async findByUsernameOrEmail(
    options: Partial<{ userName: string; email: string }>
  ): Promise<User | null> {
    let user;

    const query = options.email
      ? { email: options.email }
      : { userName: options.userName };

    try {
      user = await this.userModel
        .findOne(
          query,
          'userName name email firstName lastName userName contact langCode'
        )
        .select('password role')
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }

    return user;
  }

  /**
   * Create new user
   * @param createUserDto
   * @returns
   */
  async createUser(createUserDto: UserRegisterDto, session: ClientSession) {
    let user = await this.findByUsernameOrEmail({ email: createUserDto.email });

    if (user) {
      throw new ConflictException('User already exists');
    }

    user = new this.userModel({
      email: createUserDto.email,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      password: generateHash(createUserDto.password),
      userName: createUserDto.userName,
      refreshTokenRevoke: true,
      phone: createUserDto.phone,
      langCode: createUserDto.langCode,
      role: 'USER',
    });

    user = await user.save({ session });

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!user) {
      throw new ConflictException('User not created');
    }

    return new UserDto(user);
  }

  /**
   * Get a user by id
   * @param userId
   * @returns
   */
  async getUser(userId: string): Promise<UserDto> {
    let user;

    try {
      user = await this.userModel.findById({ _id: userId });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update refesh token
   * @param userId
   * @param isRevoke
   * @returns
   */
  async updateRefreshToken(userId: string, isRevoke: boolean) {
    return this.userModel.findOneAndUpdate(
      { _id: userId },
      { refreshTokenRevoke: isRevoke }
    );
  }

  /**
   * update user infomation into database
   * @param userId id of user login
   * @param userUpdateData user information need update
   * @returns user information after update
   */
  async updateUser(userId: string, userUpdateData: UserUpdateDto) {
    const user = await this.userModel
      .findOneAndUpdate({ _id: userId }, userUpdateData)
      .setOptions({ overwrite: true, new: true });

    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

  /**
   * User login add contact -> put another user id to user.contact
   * @param userId Id of login user
   * @param userIdContact Id of another user
   * @param session Mongose session
   * @returns New information of login user
   */
  async addAnotherUserAsContact(
    userId: string,
    userIdContact: string,
    session: ClientSession
  ) {
    if (userId === userIdContact) {
      throw new NotFoundException('User taget is user login');
    }

    // check user login exist
    const loginUser = await this.findOne(userId, true);

    if (!loginUser) {
      throw new NotFoundException('User login not found');
    }

    // check another user exist
    const userContact = await this.findOne(userIdContact, false);

    if (!userContact) {
      throw new NotFoundException('User taget not found');
    }

    // check another user had contact
    const contactList = loginUser.contact;
    const hasContact =
      contactList.length > 0 && contactList.includes(userIdContact);

    if (hasContact) {
      throw new NotFoundException('User taget had contact');
    }

    // add another user into contact and remove him from contactRequest if exists
    contactList.push(userIdContact);

    const userUpdate = await this.userModel
      .findOneAndUpdate(
        { _id: userId },
        {
          contact: contactList,
          $pull: { contactRequest: userIdContact },
        }
      )
      .setOptions({ new: true, session });

    if (!userUpdate) {
      throw new NotFoundException();
    }

    // Add user's target a contact requests
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const contactRequestList = userContact.contactRequest || [];

    if (!userContact.contact.includes(userId)) {
      await this.userModel
        .findOneAndUpdate(
          { _id: userIdContact },
          {
            contactRequest: [...contactRequestList, userId],
          }
        )
        .setOptions({ session });
    }

    return userUpdate;
  }

  /**
   * Get contact list by user -> get from table user
   * @param userId Id of user
   * @returns Array contact list
   */
  async getUserContactList(userId: string) {
    // check user has exist
    const user = await this.findOne(
      userId,
      true,
      'name email firstName lastName userName contact langCode'
    );

    if (!user) {
      return new NotFoundException('User not found');
    }

    const contactListId = user.contact;

    if (contactListId.length <= 0) {
      return [];
    }

    return this.userModel
      .find({ _id: { $in: contactListId } })
      .select('userName firstName lastName email')
      .exec();
  }

  /**
   * Get contact list by user -> get from table user
   * @param userId Id of user
   * @returns Array contact list
   */
  async getUserContactRequests(_userId: string) {
    // check user has exist
    const user = await this.findOne(
      _userId,
      true,
      'userName name email firstName lastName userName contactRequest langCode'
    );

    if (!user) {
      return new NotFoundException('User not found');
    }

    const contactRequests = user.contactRequest;

    if (contactRequests.length > 0) {
      return this.userModel
        .find({ _id: { $in: contactRequests } })
        .select('userName firstName lastName email')
        .exec();
    }

    return [];
  }

  /**
   * Search users by email, userName
   * @param searchData
   * @returns List of users with pagination
   */
  searchUser = (searchData: SearchUserDto) =>
    this.userModel.paginate(
      {
        $or: [
          { email: { $regex: searchData.q.text, $options: 'i' } },
          { userName: { $regex: searchData.q.text, $options: 'i' } },
        ],
      },
      {
        limit: searchData.limit || 50,
        page: searchData.page || 0,
        select: 'firstName lastName email userName',
      }
    );
}
