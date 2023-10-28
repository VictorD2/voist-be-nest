import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class GetClassByIdDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id: number;
}

export class GetClassDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  folder: number;
}
