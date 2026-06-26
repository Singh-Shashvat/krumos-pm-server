import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { EnvConfig } from '../../core/config/env.config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';

@Module({
  imports: [
    PassportModule,
    UsersModule,
    WorkspacesModule,
    JwtModule.registerAsync({
      inject: [EnvConfig],
      useFactory: async (envConfig: EnvConfig) => ({
        secret: envConfig.jwtConfig.jwtSecret,
        signOptions: {
          expiresIn: envConfig.jwtConfig.jwtExpiry as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
