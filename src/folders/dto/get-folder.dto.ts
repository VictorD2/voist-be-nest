import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class GetFolderDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  folder: number;
}

export class GetFolderByIdDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id: number;
}
