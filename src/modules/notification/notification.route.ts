// src/modules/notification/notification.route.ts
import { FastifyInstance } from 'fastify';
import { notificationController } from './notification.controller';
import {
  getNotificationsSchema,
  getUnreadCountSchema,
  markAsReadSchema,
  markAllAsReadSchema,
} from './validation';

export default async function notificationRoutes(fastify: FastifyInstance) {
  // All notification routes require authentication
  await fastify.register(async function authenticatedRoutes(fastify) {
    // Add JWT authentication hook
    fastify.addHook('preHandler', async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        reply.code(401).send({
          success: false,
          message: 'Authentication required',
        });
      }
    });

    // GET /api/notifications - Get user's notifications with pagination
    fastify.get('/', {
      schema: getNotificationsSchema,
      handler: notificationController.getNotifications.bind(notificationController),
    });

    // GET /api/notifications/unread-count - Get unread notification count
    fastify.get('/unread-count', {
      schema: getUnreadCountSchema,
      handler: notificationController.getUnreadCount.bind(notificationController),
    });

    // POST /api/notifications/:id/read - Mark specific notification as read
    fastify.post('/:id/read', {
      schema: markAsReadSchema,
      handler: notificationController.markAsRead.bind(notificationController),
    });

    // POST /api/notifications/mark-all-read - Mark all notifications as read
    fastify.post('/mark-all-read', {
      schema: markAllAsReadSchema,
      handler: notificationController.markAllAsRead.bind(notificationController),
    });
  });
}
