import { IsNotEmpty, IsNumber, IsInt, IsArray } from 'class-validator';

export class CreateFolderDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  folderId: number;

  @IsArray()
  contacts: Array<number>;
}
