import { IsString, IsNotEmpty } from 'class-validator';

export class AssignDriverDto {
  @IsString()
  @IsNotEmpty()
  driverId: string;
}
