import { UseGuards, Controller, Get, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. PUBLICZNY ENDPOINT – Działa zawsze dla każdego
  @Get('public')
  test() {
    return { message: 'Ten endpoint jest publiczny i działa zawsze.' };
  }

  // 2. PRYWATNY ENDPOINT – Działa tylko po zalogowaniu (z poprawnym tokenem JWT)
  @UseGuards(JwtAuthGuard)
  @Get('protected')
  getProfile(@Request() req) {
    return req.user; // Zwraca zalogowanego użytkownika (zdekodowanego w JwtStrategy)
  }


  @Get('all')
  async findAll() {
    return this.usersService.findAll();
  }
}