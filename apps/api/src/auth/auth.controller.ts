import { Controller, Get } from '@nestjs/common';
import { UserProfile } from '@lt-offers/domain';
import { AuthService } from './auth.service';
import { CurrentUser } from './auth.decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('users')
  getUsers(): UserProfile[] {
    return this.authService.getUsers();
  }

  @Get('me')
  getMe(@CurrentUser() user: UserProfile): UserProfile {
    return user;
  }
}
