import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { EnvConfig } from '../../../core/config/env.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(envConfig: EnvConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envConfig.jwtConfig.jwtSecret || '',
    });
  }

  async validate(payload: any) {
    // This value is injected into req.user
    return { 
      id: payload.sub, 
      email: payload.email, 
      name: payload.name 
    };
  }
}
