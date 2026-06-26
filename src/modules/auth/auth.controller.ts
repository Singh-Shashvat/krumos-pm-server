import { Controller, Get, UseGuards, Request, Response, UnauthorizedException } from '@nestjs/common';
import { EnvConfig } from '../../core/config/env.config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { GoogleOAuthGuard } from '../../core/guards/google-oauth.guard';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly workspacesService: WorkspacesService,
    private readonly envConfig: EnvConfig,
  ) {}

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(@Request() req) {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(@Request() req, @Response() res) {
    if (!req.user) {
      throw new UnauthorizedException('Google authentication failed');
    }

    // Google strategy validation attaches user info to req.user
    const { email, name, picture } = req.user;
    
    // Resolve user in our database
    const dbUser = await this.authService.validateOAuthUser(email, name, picture);
    
    // Issue token
    const { accessToken } = await this.authService.login(dbUser);
    
    // Redirect to frontend callback page with the token
    const frontendUrl = this.envConfig.appConfig.primaryFrontendUrl;
    return res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const workspaces = await this.workspacesService.findByUserId(user.id);
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      createdAt: user.createdAt,
      hasWorkspaces: workspaces.length > 0,
    };
  }
}
