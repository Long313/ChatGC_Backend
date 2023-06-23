import { ApiProperty } from '@nestjs/swagger';

import { UserDto } from '../../../user/dtos/user.dto';
import { RefreshTokenPayloadDto } from './RefreshTokenPayload';
import { TokenPayloadDto } from './TokenPayloadDto';

export class LoginPayloadDto {
  @ApiProperty({ type: UserDto })
  user: UserDto;

  @ApiProperty({ type: TokenPayloadDto })
  token: TokenPayloadDto;

  @ApiProperty({ type: RefreshTokenPayloadDto })
  refreshToken: RefreshTokenPayloadDto;

  constructor(
    user: UserDto,
    token: TokenPayloadDto,
    refreshToken: RefreshTokenPayloadDto
  ) {
    this.user = user;
    this.token = token;
    this.refreshToken = refreshToken;
  }
}
