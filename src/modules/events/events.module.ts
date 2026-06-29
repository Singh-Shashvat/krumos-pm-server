import { Global, Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceMember } from '@/database/entities/workspace-member.entity';

@Global()
@Module({
  imports: [JwtModule,TypeOrmModule.forFeature([WorkspaceMember])],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
