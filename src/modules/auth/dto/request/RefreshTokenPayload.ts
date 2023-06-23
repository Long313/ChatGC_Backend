import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenPayloadDto {
  @ApiProperty()
  expiresIn: number;

  @ApiProperty()
  refreshToken: string;

  constructor(data: { expiresIn: number; refreshToken: string }) {
    this.expiresIn = data.expiresIn;
    this.refreshToken = data.refreshToken;
  }
}
