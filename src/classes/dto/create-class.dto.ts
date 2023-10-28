import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber } from 'class-validator';
export class CreateClassDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @IsInt()
  folderId: number;

  @IsNotEmpty()
  @Type(() => Array)
  contacts: Array<number>;
}

export class CreateResumenDto {
  @IsNotEmpty()
  content: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @IsInt()
  classId: number;
}
