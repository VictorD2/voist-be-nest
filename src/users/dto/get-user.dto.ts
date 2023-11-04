import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetUserDto {
  @IsString()
  filter: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  page: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  limit: number;
}

export class GetUserByIdDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id: number;
}
