import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceMember } from '@/database/entities/workspace-member.entity';

interface AuthenticatedSocket extends Socket{
  user?:{
    sub: string;
    email?:string;
  };
}
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>
  ){}

  handleConnection(client: AuthenticatedSocket) {
    try{
      const token = client.handshake.auth?.token as string | undefined;
      if(!token){
        client.disconnect(true);
        return;
      }
      const payload = this.jwtService.verify(token);
      client.user = {
        sub: payload.sub,
        email:payload.email
      };

      console.log(`Authenticated socket connected: ${client.id} (${payload.sub})`);
    }catch(error){
      console.error('authentication failed' , error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`WebSocket client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_workspace')
  async handleJoinWorkspace(
    @MessageBody('workspaceId') workspaceId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (workspaceId) {
      try {
        const userId = client.user?.sub;
        if (!userId) {
          return { status: 'error', message: 'Unauthorized' };
        }

       if(!workspaceId){
        return{ status:'error', message:'workspaceId is required'};
       }

       const membership = await this.workspaceMemberRepository.findOne({
        where:{
          userId,
          workspaceId,
        },
       });

       if(!membership){
        return{
          status:'error',
          message:'forbidden',
        }
       }

      
      const room = `workspace_${workspaceId}`;
      await client.join(room);
      console.log(`socket ${client.id} joined workspace room ${room}`)
      return { status: 'ok', room };
      }
    catch(error){
      console.error(`Socket ${client.id} failed to join workspace room: ${workspaceId}`);
    }
    return { status: 'error', message: 'failed to join workspace' };}
  }

  @SubscribeMessage('join_user')
  handleJoinUser(
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = client.user?.sub;

    if (!userId) {
      return{
        status: 'error',
        message: 'Unauthorized',
      };
    }
    const room = `user_${userId}`;
    client.join(room);
    console.log(`Socket ${client.id} joined user room ${room}`)
    return { status: 'ok', room };
  }

  // Helpers to emit updates from REST controllers/services
  emitTaskUpdated(workspaceId: string, data: unknown) {
    this.server?.to(`workspace_${workspaceId}`).emit('task_updated', data);
  }

  emitNotificationCreated(userId: string, unreadCount: number, notification: unknown) {
    this.server?.to(`user_${userId}`).emit('notification_created', {
        unreadCount,
        notification,
      });
  }

  emitMemberUpdated(workspaceId: string) {
    this.server?.to(`workspace_${workspaceId}`).emit('member_updated');
  }
}
