import { Controller, Post, HttpCode, Body, UsePipes, ValidationPipe, Get } from '@nestjs/common';
import { AuthDto } from 'src/auth/dto/auth.dto';
import { TokenDto } from 'src/auth/dto/token.dto';
import { User } from 'src/user/decorators/user.decorator';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('register')
  async register(@Body() dto: AuthDto) {
    return this.authService.register(dto)
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: AuthDto) {
    return this.authService.login(dto)
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('access')
  async getNewTokens(@Body() dto: TokenDto) {
    return this.authService.getNewTokens(dto)
  }

  @HttpCode(200)
  @Post('check-user')
  async checkUser(@Body() dto: {email: string}) {
    return this.authService.checkUser(dto.email)
  }

  @HttpCode(200)
  @Get('check-instructor')
  @Auth('INSTRUCTOR')
  async checkInstructor(@User('_id') _id: string) {
    return _id ? true : false
  }
}