import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('api/v0/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   *
   * @param loginDto
   * @returns
   */
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() loginDto: LoginDto) {
    return await this.authService.signin(loginDto);
  }

  /**
   *
   * @param registerDto
   * @returns
   */
  @Post('signup')
  @HttpCode(HttpStatus.OK)
  async signup(@Body() registerDto: RegisterDto) {
    return await this.authService.signup(registerDto);
  }
}
