import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { Workspace } from '../../database/entities/workspace.entity';
import { WorkspaceMember } from '../../database/entities/workspace-member.entity';
import { Invitation } from '../../database/entities/invitation.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace, WorkspaceMember, Invitation, User])],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
