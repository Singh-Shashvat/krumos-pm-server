import { Global, Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceMember } from '@/database/entities/workspace-member.entity';
import { ConfigModule } from '../../core/config/config.module';
import { EnvConfig } from '../../core/config/env.config';

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [EnvConfig],
      useFactory: async (envConfig: EnvConfig) => ({
        secret: envConfig.jwtConfig.jwtSecret,
        signOptions: {
          expiresIn: envConfig.jwtConfig.jwtExpiry as any,
        },
      }),
    }),
    TypeOrmModule.forFeature([WorkspaceMember]),
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
