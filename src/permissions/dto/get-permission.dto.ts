import { IsInt, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class GetPermissionIdDto {
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @IsPositive()
  id: number;
}
