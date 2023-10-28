import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class GetConversationsByClassIdDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  classId: number;
}
