import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Connection } from 'mongoose';

import { ApiFile, Auth, AuthUser } from '../../decorators';
import { UserDto } from '../user/dtos/user.dto';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { LoginPayloadDto } from './dto/request/LoginPayloadDto';
import { RefreshTokenDto } from './dto/request/RefreshTokenDto';
import { TokenPayloadDto } from './dto/request/TokenPayloadDto';
import { UserLoginDto } from './dto/request/UserLoginDto';
import { UserRegisterDto } from './dto/request/UserRegisterDto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    @InjectConnection() private readonly mongoConnection: Connection
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: LoginPayloadDto,
    description: 'User info with access token',
  })
  async userLogin(
    @Body() userLoginDto: UserLoginDto
  ): Promise<LoginPayloadDto> {
    const userEntity = await this.authService.validateUser(userLoginDto);

    const token = await this.authService.createAccessToken({
      userId: userEntity._id || '',
      role: userEntity.role,
    });

    const refreshToken = await this.authService.createRefreshToken({
      userId: userEntity._id || '',
      role: userEntity.role,
    });

    return new LoginPayloadDto(userEntity, token, refreshToken);
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserDto, description: 'Successfully Registered' })
  @ApiFile({ name: 'avatar' })
  async userRegister(
    @Body() userRegisterDto: UserRegisterDto
  ): Promise<UserDto> {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();

    try {
      const data = await this.userService.createUser(userRegisterDto, session);
      void session.commitTransaction();

      return data;
    } catch (error) {
      await session.abortTransaction();

      throw error;
    }
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @Auth([])
  @ApiOkResponse({ type: UserDto, description: 'Current user info' })
  getCurrentUser(@AuthUser() user: UserDto): UserDto {
    return user;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: TokenPayloadDto,
    description: ' User info with accessToken',
  })
  async refreshToken(@Body() data: RefreshTokenDto): Promise<TokenPayloadDto> {
    return this.authService.createTokenFromRefreshToken(data.refreshToken);
  }
}
