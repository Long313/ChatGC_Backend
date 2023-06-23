import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';
import { UserDto } from 'modules/user/dtos/user.dto';

import { validateHash } from '../../common/utils';
import { TokenType } from '../../constants';
import { UserNotFoundException } from '../../exceptions';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { UserService } from '../user/user.service';
import { RefreshTokenPayloadDto } from './dto/request/RefreshTokenPayload';
import { TokenPayloadDto } from './dto/request/TokenPayloadDto';
import type { UserLoginDto } from './dto/request/UserLoginDto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ApiConfigService,
    private userService: UserService
  ) {}

  async createRefreshToken(data: {
    role: string;
    userId: string;
  }): Promise<RefreshTokenPayloadDto> {
    try {
      const refreshToken = await this.jwtService.signAsync(
        {
          userId: data.userId,
          type: TokenType.ACCESS_TOKEN,
          role: data.role,
        },
        {
          expiresIn: '30 days',
          secret: this.configService.authConfig.secret,
        }
      );

      await this.userService.updateRefreshToken(data.userId, false);

      return new RefreshTokenPayloadDto({
        expiresIn: 60 * 60 * 24 * 30,
        refreshToken,
      });
    } catch {
      throw new UnauthorizedException();
    }
  }

  // eslint-disable-next-line sonarjs/no-identical-functions
  async createAccessToken(data: {
    role: string;
    userId: string;
  }): Promise<TokenPayloadDto> {
    return new TokenPayloadDto({
      expiresIn: this.configService.authConfig.jwtExpirationTime,
      accessToken: await this.jwtService.signAsync({
        userId: data.userId,
        type: TokenType.ACCESS_TOKEN,
        role: data.role,
      }),
    });
  }

  async createTokenFromRefreshToken(
    refreshToken: string
  ): Promise<TokenPayloadDto> {
    // Verify refresh token
    let claims;

    try {
      claims = await this.jwtService.verifyAsync(refreshToken);
    } catch (error) {
      throw error instanceof TokenExpiredError
        ? new UnprocessableEntityException('Refresh token expired')
        : new UnprocessableEntityException('Refresh token malformed');
    }

    const userId: string = claims.userId;
    const user = await this.userService.findOne(userId, true);

    if (!user) {
      throw new UnauthorizedException();
    }

    return this.createAccessToken({ role: 'USER', userId });
  }

  async validateUser(userLoginDto: UserLoginDto): Promise<UserDto> {
    const user = await this.userService.findByUsernameOrEmail({
      email: userLoginDto.email,
    });

    const isPasswordValid = await validateHash(
      userLoginDto.password,
      user?.password
    );

    if (!user || !isPasswordValid) {
      throw new UserNotFoundException('The password or email is incorrect');
    } else {
      return new UserDto(user);
    }
  }
}
