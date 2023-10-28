import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class GetContactDto {
  @IsNotEmpty()
  @IsString()
  filter: string;
}

export class GetContactByIdDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id: number;
}
