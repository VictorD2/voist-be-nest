import { IsInt, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateContactDto {
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @IsPositive()
  userId: number;
}
