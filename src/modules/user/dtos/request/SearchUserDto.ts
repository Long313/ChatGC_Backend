import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { QueryParams } from 'common/dto/get-query.dto';

class SchemaUserQuery {
  @IsString()
  text: string; // Text search for email, userName
}

export class SearchUserDto extends QueryParams {
  @ApiProperty()
  @IsOptional()
  @ValidateNested()
  @Type(() => SchemaUserQuery)
  q: Record<string, unknown>;
}
