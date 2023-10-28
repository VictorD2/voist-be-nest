import { IsInt, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateConversationDto {
  @IsNotEmpty()
  question: string;

  @IsNotEmpty()
  answer: string;

  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  classId: number;
}
