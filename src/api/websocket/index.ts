/**
 * WebSocket Server Setup
 * Real-time features for the beauty and fitness booking platform
 */

import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { apiConfig } from '../config';
import { logger } from '../utils/logger';
import { supabaseService } from '../integrations/supabase';

export interface AuthenticatedSocket extends Socket {
  user?: any;
  userId?: string;
}

export interface SocketEvent {
  type: string;
  payload: any;
  timestamp: string;
  userId?: string;
  socketId?: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
    this.startCleanupInterval();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, apiConfig.jwtSecret) as any;

        // Fetch user from database
        const user = await supabaseService.findById('profiles', decoded.sub);

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        socket.userId = user.id;

        logger.info('WebSocket user authenticated', {
          socketId: socket.id,
          userId: user.id,
          email: user.email,
        });

        next();
      } catch (error) {
        logger.security('WebSocket authentication failed', {
          socketId: socket.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          ip: socket.handshake.address,
        });

        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info('WebSocket client connected', {
        socketId: socket.id,
        userId: socket.userId,
        totalConnections: this.io.engine.clientsCount,
      });

      // Track user connections
      if (socket.userId) {
        if (!this.connectedUsers.has(socket.userId)) {
          this.connectedUsers.set(socket.userId, new Set());
        }
        this.connectedUsers.get(socket.userId)!.add(socket.id);
        this.socketUsers.set(socket.id, socket.userId);

        // Join user to their personal room
        socket.join(`user:${socket.userId}`);
      }

      // Join admin room if user is admin
      if (socket.user?.role === 'admin') {
        socket.join('admin');
        logger.info('Admin connected to WebSocket', {
          socketId: socket.id,
          userId: socket.userId,
        });
      }

      // Handle custom events
      this.setupClientEventHandlers(socket);

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info('WebSocket client disconnected', {
          socketId: socket.id,
          userId: socket.userId,
          reason,
          totalConnections: this.io.engine.clientsCount,
        });

        this.handleDisconnection(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error('WebSocket socket error', {
          socketId: socket.id,
          userId: socket.userId,
          error: error.message,
        });
      });
    });
  }

  private setupClientEventHandlers(socket: AuthenticatedSocket): void {
    // Join booking room
    socket.on('join-booking', (bookingId: string) => {
      if (typeof bookingId === 'string' && bookingId.length > 0) {
        socket.join(`booking:${bookingId}`);
        logger.debug('User joined booking room', {
          socketId: socket.id,
          userId: socket.userId,
          bookingId,
        });

        socket.emit('joined-booking', { bookingId });
      } else {
        socket.emit('error', { message: 'Invalid booking ID' });
      }
    });

    // Leave booking room
    socket.on('leave-booking', (bookingId: string) => {
      if (typeof bookingId === 'string' && bookingId.length > 0) {
        socket.leave(`booking:${bookingId}`);
        logger.debug('User left booking room', {
          socketId: socket.id,
          userId: socket.userId,
          bookingId,
        });

        socket.emit('left-booking', { bookingId });
      }
    });

    // Join service room for availability updates
    socket.on('join-service', (serviceId: string) => {
      if (typeof serviceId === 'string' && serviceId.length > 0) {
        socket.join(`service:${serviceId}`);
        logger.debug('User joined service room', {
          socketId: socket.id,
          userId: socket.userId,
          serviceId,
        });

        socket.emit('joined-service', { serviceId });
      }
    });

    // Real-time availability check
    socket.on('check-availability', async (data: { serviceId: string; date: string }) => {
      try {
        const { serviceId, date } = data;

        if (!serviceId || !date) {
          socket.emit('error', { message: 'Service ID and date are required' });
          return;
        }

        const availableSlots = await supabaseService.findAvailableSlots(serviceId, date);

        socket.emit('availability-updated', {
          serviceId,
          date,
          availableSlots,
          timestamp: new Date().toISOString(),
        });

        logger.debug('Availability check completed', {
          socketId: socket.id,
          userId: socket.userId,
          serviceId,
          date,
          slotsFound: availableSlots.length,
        });
      } catch (error) {
        logger.error('Availability check failed', {
          socketId: socket.id,
          userId: socket.userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        socket.emit('error', { message: 'Failed to check availability' });
      }
    });

    // Hold time slot
    socket.on('hold-slot', async (data: { serviceId: string; date: string; timeSlot: string }) => {
      try {
        const { serviceId, date, timeSlot } = data;

        if (!serviceId || !date || !timeSlot) {
          socket.emit('error', { message: 'Service ID, date, and time slot are required' });
          return;
        }

        const hold = await supabaseService.createBookingHold(
          serviceId,
          date,
          timeSlot,
          socket.id,
          socket.userId
        );

        socket.emit('slot-held', {
          holdId: hold.id,
          serviceId,
          date,
          timeSlot,
          expiresAt: hold.expires_at,
          timestamp: new Date().toISOString(),
        });

        logger.debug('Time slot held', {
          socketId: socket.id,
          userId: socket.userId,
          serviceId,
          date,
          timeSlot,
          holdId: hold.id,
        });
      } catch (error) {
        logger.error('Hold slot failed', {
          socketId: socket.id,
          userId: socket.userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        socket.emit('error', { message: 'Failed to hold time slot' });
      }
    });

    // Release hold
    socket.on('release-hold', async (data: { holdId?: string }) => {
      try {
        const { holdId } = data;

        // Use socket ID as session ID if no hold ID provided
        const sessionId = holdId || socket.id;

        await supabaseService.releaseHold(sessionId);

        socket.emit('hold-released', {
          sessionId,
          timestamp: new Date().toISOString(),
        });

        logger.debug('Hold released', {
          socketId: socket.id,
          userId: socket.userId,
          sessionId,
        });
      } catch (error) {
        logger.error('Release hold failed', {
          socketId: socket.id,
          userId: socket.userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        socket.emit('error', { message: 'Failed to release hold' });
      }
    });

    // Chat/Support messaging
    socket.on('support-message', (data: { message: string; bookingId?: string }) => {
      const { message, bookingId } = data;

      if (!message || typeof message !== 'string') {
        socket.emit('error', { message: 'Message is required' });
        return;
      }

      const messageData = {
        id: generateMessageId(),
        userId: socket.userId,
        userEmail: socket.user?.email,
        userName: socket.user?.full_name,
        message: message.trim(),
        bookingId,
        timestamp: new Date().toISOString(),
        socketId: socket.id,
      };

      // Send to support staff (admin room)
      this.io.to('admin').emit('support-message', messageData);

      // Send confirmation to user
      socket.emit('message-sent', {
        messageId: messageData.id,
        timestamp: messageData.timestamp,
      });

      logger.info('Support message received', {
        socketId: socket.id,
        userId: socket.userId,
        messageId: messageData.id,
        bookingId,
        messageLength: message.length,
      });
    });

    // Typing indicators
    socket.on('typing-start', (data: { room: string }) => {
      if (data.room && typeof data.room === 'string') {
        socket.to(data.room).emit('user-typing', {
          userId: socket.userId,
          userName: socket.user?.full_name,
          isTyping: true,
        });
      }
    });

    socket.on('typing-stop', (data: { room: string }) => {
      if (data.room && typeof data.room === 'string') {
        socket.to(data.room).emit('user-typing', {
          userId: socket.userId,
          isTyping: false,
        });
      }
    });

    // Heartbeat for connection health
    socket.on('ping', () => {
      socket.emit('pong', {
        timestamp: new Date().toISOString(),
        latency: Date.now() - (socket.handshake.time || Date.now()),
      });
    });
  }

  private handleDisconnection(socket: AuthenticatedSocket): void {
    // Clean up user connection tracking
    if (socket.userId) {
      const userSockets = this.connectedUsers.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(socket.userId);
        }
      }
      this.socketUsers.delete(socket.id);
    }
  }

  // Public methods for sending events
  public sendToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    logger.debug('Event sent to user', {
      userId,
      event,
      connectedSockets: this.connectedUsers.get(userId)?.size || 0,
    });
  }

  public sendToBooking(bookingId: string, event: string, data: any): void {
    this.io.to(`booking:${bookingId}`).emit(event, {
      ...data,
      bookingId,
      timestamp: new Date().toISOString(),
    });

    logger.debug('Event sent to booking room', {
      bookingId,
      event,
    });
  }

  public sendToService(serviceId: string, event: string, data: any): void {
    this.io.to(`service:${serviceId}`).emit(event, {
      ...data,
      serviceId,
      timestamp: new Date().toISOString(),
    });

    logger.debug('Event sent to service room', {
      serviceId,
      event,
    });
  }

  public sendToAdmins(event: string, data: any): void {
    this.io.to('admin').emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    logger.debug('Event sent to admins', {
      event,
    });
  }

  public broadcast(event: string, data: any): void {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    logger.debug('Event broadcasted', {
      event,
      totalConnections: this.io.engine.clientsCount,
    });
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public getUserConnections(userId: string): number {
    return this.connectedUsers.get(userId)?.size || 0;
  }

  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
  }

  // Cleanup expired holds periodically
  private startCleanupInterval(): void {
    setInterval(async () => {
      try {
        const cleanedCount = await supabaseService.cleanupExpiredHolds();

        if (cleanedCount > 0) {
          logger.info('Expired holds cleaned up', {
            count: cleanedCount,
          });

          // Notify admin users about cleanup
          this.sendToAdmins('holds-cleaned', {
            count: cleanedCount,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        logger.error('Failed to cleanup expired holds', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Get server statistics
  public getStats(): any {
    return {
      totalConnections: this.io.engine.clientsCount,
      connectedUsers: this.connectedUsers.size,
      totalSockets: this.socketUsers.size,
      userConnections: Object.fromEntries(
        Array.from(this.connectedUsers.entries()).map(([userId, sockets]) => [
          userId,
          sockets.size,
        ])
      ),
    };
  }
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// WebSocket setup function
export function setupWebSocket(io: SocketIOServer): WebSocketService {
  const wsService = new WebSocketService(io);

  logger.info('WebSocket server initialized', {
    transports: io.engine.opts.transports,
    cors: io.engine.opts.cors,
  });

  return wsService;
}

export { WebSocketService };