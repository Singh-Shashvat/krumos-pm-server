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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`WebSocket client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`WebSocket client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_workspace')
  handleJoinWorkspace(
    @MessageBody('workspaceId') workspaceId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (workspaceId) {
      const room = `workspace_${workspaceId}`;
      client.join(room);
      console.log(`Socket ${client.id} joined room: ${room}`);
      return { status: 'ok', room };
    }
    return { status: 'error', message: 'Workspace ID required' };
  }

  @SubscribeMessage('join_user')
  handleJoinUser(
    @MessageBody('userId') userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (userId) {
      const room = `user_${userId}`;
      client.join(room);
      console.log(`Socket ${client.id} joined room: ${room}`);
      return { status: 'ok', room };
    }
    return { status: 'error', message: 'User ID required' };
  }

  // Helpers to emit updates from REST controllers/services
  emitTaskUpdated(workspaceId: string, data: any) {
    if (this.server) {
      this.server.to(`workspace_${workspaceId}`).emit('task_updated', data);
    }
  }

  emitNotificationCreated(userId: string, unreadCount: number, notification: any) {
    if (this.server) {
      this.server.to(`user_${userId}`).emit('notification_created', {
        unreadCount,
        notification,
      });
    }
  }

  emitMemberUpdated(workspaceId: string) {
    if (this.server) {
      this.server.to(`workspace_${workspaceId}`).emit('member_updated');
    }
  }
}
