import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateOAuthUser(email: string, name: string, picture: string) {
    const user = await this.usersService.findOrCreate(email, name, picture);
    return user;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
