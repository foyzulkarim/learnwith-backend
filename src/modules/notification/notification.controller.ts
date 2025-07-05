// src/modules/notification/notification.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { notificationService } from './notification.service';
import {
  getNotificationsQuerySchema,
  markAsReadParamsSchema,
  GetNotificationsQuery,
  MarkAsReadParams,
} from './validation';
import { AppError } from '../../utils/errors';

export class NotificationController {
  /**
   * Get notifications for the authenticated user
   */
  async getNotifications(
    request: FastifyRequest<{ Querystring: GetNotificationsQuery }>,
    reply: FastifyReply,
  ) {
    try {
      // Validate query parameters
      const { page, limit } = getNotificationsQuerySchema.parse(request.query);

      // Get user ID from JWT token
      const userId = request.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const result = await notificationService.getUserNotifications(userId, page, limit);

      return reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      request.log.error('Error fetching notifications:', error);

      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({
          success: false,
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get unread notification count for the authenticated user
   */
  async getUnreadCount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const result = await notificationService.getUnreadCount(userId);

      return reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      request.log.error('Error fetching unread count:', error);

      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({
          success: false,
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(request: FastifyRequest<{ Params: MarkAsReadParams }>, reply: FastifyReply) {
    try {
      const { id } = markAsReadParamsSchema.parse(request.params);

      const userId = request.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const success = await notificationService.markAsRead(userId, id);

      if (!success) {
        return reply.code(404).send({
          success: false,
          message: 'Notification not found or already read',
        });
      }

      return reply.code(200).send({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      request.log.error('Error marking notification as read:', error);

      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({
          success: false,
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Mark all notifications as read for the authenticated user
   */
  async markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const updatedCount = await notificationService.markAllAsRead(userId);

      return reply.code(200).send({
        success: true,
        message: `${updatedCount} notifications marked as read`,
        data: { updatedCount },
      });
    } catch (error) {
      request.log.error('Error marking all notifications as read:', error);

      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({
          success: false,
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export const notificationController = new NotificationController();
