import { IsString, IsEmail, IsNotEmpty } from "class-validator";

export class AuthDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  password: string;

  fullName: string;

  avatar: string;
}