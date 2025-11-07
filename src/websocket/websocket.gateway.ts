import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { LocationUpdateDto, SubscribeToScheduleDto } from './dto/location-update.dto';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Configure this properly in production
    credentials: true,
  },
  namespace: '/ws',
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('WebsocketGateway');

  // Track connected clients by userId
  private connectedClients: Map<string, Socket> = new Map();

  // Track driver locations by scheduleId
  private driverLocations: Map<string, { latitude: number; longitude: number; timestamp: Date }> = new Map();

  // Track schedule subscriptions (scheduleId -> Set of socket IDs)
  private scheduleSubscriptions: Map<string, Set<string>> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      this.logger.log(`Client attempting to connect: ${client.id}`);

      // The WsAuthGuard will validate and attach user data
      // But we need to manually call it here for connection events
      const token = client.handshake.auth?.token ||
                    client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected - no token`);
        client.disconnect();
        return;
      }

      this.logger.log(`Client connected: ${client.id}`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.data.user?.id;

    if (userId) {
      this.connectedClients.delete(userId);
      this.logger.log(`Client disconnected: ${client.id} (User: ${userId})`);

      // Clean up schedule subscriptions
      this.scheduleSubscriptions.forEach((subscribers, scheduleId) => {
        subscribers.delete(client.id);
        if (subscribers.size === 0) {
          this.scheduleSubscriptions.delete(scheduleId);
        }
      });
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('authenticate')
  handleAuthenticate(@ConnectedSocket() client: Socket) {
    const user = client.data.user;

    if (user) {
      this.connectedClients.set(user.id, client);
      this.logger.log(`User authenticated: ${user.id} (${user.role})`);

      return {
        event: 'authenticated',
        data: {
          userId: user.id,
          role: user.role,
          message: 'Successfully authenticated',
        },
      };
    }

    return {
      event: 'error',
      data: { message: 'Authentication failed' },
    };
  }

  // ============================================
  // SCHEDULE SUBSCRIPTIONS
  // ============================================

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('subscribe:schedule')
  async handleSubscribeToSchedule(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SubscribeToScheduleDto,
  ) {
    const { scheduleId } = data;
    const user = client.data.user;

    this.logger.log(`User ${user.id} subscribing to schedule ${scheduleId}`);

    // Add to subscription map
    if (!this.scheduleSubscriptions.has(scheduleId)) {
      this.scheduleSubscriptions.set(scheduleId, new Set());
    }
    this.scheduleSubscriptions.get(scheduleId)!.add(client.id);

    // Join socket room for this schedule
    client.join(`schedule:${scheduleId}`);

    // Send current driver location if available
    const location = this.driverLocations.get(scheduleId);
    if (location) {
      client.emit('driver:location', {
        scheduleId,
        ...location,
      });
    }

    return {
      event: 'subscribed',
      data: {
        scheduleId,
        message: 'Successfully subscribed to schedule updates',
      },
    };
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('unsubscribe:schedule')
  handleUnsubscribeFromSchedule(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SubscribeToScheduleDto,
  ) {
    const { scheduleId } = data;
    const user = client.data.user;

    this.logger.log(`User ${user.id} unsubscribing from schedule ${scheduleId}`);

    // Remove from subscription map
    const subscribers = this.scheduleSubscriptions.get(scheduleId);
    if (subscribers) {
      subscribers.delete(client.id);
      if (subscribers.size === 0) {
        this.scheduleSubscriptions.delete(scheduleId);
      }
    }

    // Leave socket room
    client.leave(`schedule:${scheduleId}`);

    return {
      event: 'unsubscribed',
      data: {
        scheduleId,
        message: 'Successfully unsubscribed from schedule updates',
      },
    };
  }

  // ============================================
  // DRIVER LOCATION UPDATES
  // ============================================

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('driver:update-location')
  async handleDriverLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LocationUpdateDto & { scheduleId: string },
  ) {
    const user = client.data.user;
    const { scheduleId, latitude, longitude, speed, heading, accuracy } = data;

    // Verify user is a driver
    if (user.role !== 'DRIVER') {
      return {
        event: 'error',
        data: { message: 'Only drivers can update location' },
      };
    }

    // Verify driver is assigned to this schedule
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        driver: {
          userId: user.id,
        },
      },
    });

    if (!schedule) {
      return {
        event: 'error',
        data: { message: 'Driver not assigned to this schedule' },
      };
    }

    // Store location
    this.driverLocations.set(scheduleId, {
      latitude,
      longitude,
      timestamp: new Date(),
    });

    // Broadcast to all subscribers of this schedule
    this.server.to(`schedule:${scheduleId}`).emit('driver:location', {
      scheduleId,
      latitude,
      longitude,
      speed,
      heading,
      accuracy,
      timestamp: new Date(),
    });

    this.logger.log(`Driver location updated for schedule ${scheduleId}`);

    return {
      event: 'location-updated',
      data: { message: 'Location updated successfully' },
    };
  }

  // ============================================
  // PUBLIC METHODS FOR BROADCASTING
  // ============================================

  /**
   * Broadcast schedule update to all subscribed clients
   */
  broadcastScheduleUpdate(scheduleId: string, data: any) {
    this.server.to(`schedule:${scheduleId}`).emit('schedule:updated', {
      scheduleId,
      ...data,
    });
    this.logger.log(`Broadcasted schedule update for ${scheduleId}`);
  }

  /**
   * Broadcast ticket status update to specific user
   */
  broadcastTicketUpdate(userId: string, ticketData: any) {
    const client = this.connectedClients.get(userId);
    if (client) {
      client.emit('ticket:updated', ticketData);
      this.logger.log(`Sent ticket update to user ${userId}`);
    }
  }

  /**
   * Broadcast payment proof status update to specific customer
   */
  broadcastPaymentProofUpdate(userId: string, paymentProofData: any) {
    const client = this.connectedClients.get(userId);
    if (client) {
      client.emit('payment-proof:updated', paymentProofData);
      this.logger.log(`Sent payment proof update to user ${userId}`);
    }
  }

  /**
   * Notify driver of new trip assignment
   */
  notifyDriverAssignment(userId: string, scheduleData: any) {
    const client = this.connectedClients.get(userId);
    if (client) {
      client.emit('driver:trip-assigned', scheduleData);
      this.logger.log(`Notified driver ${userId} of new trip assignment`);
    }
  }

  /**
   * Broadcast to all users with specific role
   */
  broadcastToRole(role: string, event: string, data: any) {
    this.connectedClients.forEach((client, userId) => {
      if (client.data.user?.role === role) {
        client.emit(event, data);
      }
    });
    this.logger.log(`Broadcasted ${event} to all users with role ${role}`);
  }
}
