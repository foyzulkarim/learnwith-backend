// src/modules/notification/notification.service.ts
import mongoose from 'mongoose';
import { Notification, NotificationDocument } from './notification.model';
import { UserNotification } from './user-notification.model';
import { CreateNotificationData, NotificationResponse, UnreadCountResponse } from './types';
import { AppError } from '../../utils/errors';

export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationData): Promise<NotificationDocument> {
    try {
      const notification = new Notification({
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
        isGlobal: data.isGlobal ?? true,
        targetUsers: data.targetUsers || [],
      });

      const savedNotification = await notification.save();

      // If it's a global notification, create user notification records for all users
      if (savedNotification.isGlobal) {
        await this.createUserNotificationsForAllUsers(
          savedNotification._id as mongoose.Types.ObjectId,
        );
      } else if (data.targetUsers && data.targetUsers.length > 0) {
        // Create user notification records for specific users
        const targetUserIds = data.targetUsers.map((id) =>
          typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id,
        );
        await this.createUserNotificationsForUsers(
          savedNotification._id as mongoose.Types.ObjectId,
          targetUserIds,
        );
      }

      return savedNotification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw new AppError('Failed to create notification', 500);
    }
  }

  /**
   * Create user notification records for all users
   */
  private async createUserNotificationsForAllUsers(
    notificationId: mongoose.Types.ObjectId,
  ): Promise<void> {
    try {
      // Get all user IDs from the User collection
      const { getUserModel } = await import('../user/user.model');
      const User = getUserModel();
      const users = await User.find({}, { _id: 1 });

      const userNotifications = users.map((user) => ({
        userId: user._id,
        notificationId,
        isRead: false,
      }));

      if (userNotifications.length > 0) {
        await UserNotification.insertMany(userNotifications, { ordered: false });
      }
    } catch (error) {
      // Log error but don't throw - notification creation should succeed even if user notifications fail
      console.error('Failed to create user notifications for all users:', error);
    }
  }

  /**
   * Create user notification records for specific users
   */
  private async createUserNotificationsForUsers(
    notificationId: mongoose.Types.ObjectId,
    userIds: mongoose.Types.ObjectId[],
  ): Promise<void> {
    try {
      const userNotifications = userIds.map((userId) => ({
        userId,
        notificationId,
        isRead: false,
      }));

      await UserNotification.insertMany(userNotifications, { ordered: false });
    } catch (error) {
      console.error('Failed to create user notifications for specific users:', error);
    }
  }

  /**
   * Get notifications for a user with pagination
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<NotificationResponse> {
    try {
      const skip = (page - 1) * limit;

      // Aggregate to join notifications with user notification status
      const pipeline: any[] = [
        {
          $match: { userId: new mongoose.Types.ObjectId(userId) },
        },
        {
          $lookup: {
            from: 'notifications',
            localField: 'notificationId',
            foreignField: '_id',
            as: 'notification',
          },
        },
        {
          $unwind: '$notification',
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $facet: {
            notifications: [
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  _id: '$notification._id',
                  type: '$notification.type',
                  title: '$notification.title',
                  message: '$notification.message',
                  metadata: '$notification.metadata',
                  createdAt: '$notification.createdAt',
                  isRead: '$isRead',
                  readAt: '$readAt',
                },
              },
            ],
            totalCount: [{ $count: 'count' }],
          },
        },
      ];

      const result = await UserNotification.aggregate(pipeline);
      const notifications = result[0].notifications || [];
      const total = result[0].totalCount[0]?.count || 0;
      const hasMore = skip + notifications.length < total;

      return {
        notifications,
        total,
        hasMore,
        page,
        limit,
      };
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw new AppError('Failed to fetch notifications', 500);
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<UnreadCountResponse> {
    try {
      const count = await UserNotification.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        isRead: false,
      });

      return { count };
    } catch (error) {
      console.error('Failed to get unread count:', error);
      throw new AppError('Failed to get unread count', 500);
    }
  }

  /**
   * Mark a notification as read for a user
   */
  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    try {
      const result = await UserNotification.updateOne(
        {
          userId: new mongoose.Types.ObjectId(userId),
          notificationId: new mongoose.Types.ObjectId(notificationId),
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        },
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw new AppError('Failed to mark notification as read', 500);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await UserNotification.updateMany(
        {
          userId: new mongoose.Types.ObjectId(userId),
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        },
      );

      return result.modifiedCount;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw new AppError('Failed to mark all notifications as read', 500);
    }
  }

  /**
   * Create notification for new video
   */
  async createVideoNotification(
    courseId: string,
    courseName: string,
    videoId: string,
    videoTitle: string,
  ): Promise<void> {
    await this.createNotification({
      type: 'new_video',
      title: 'New Video Available',
      message: `A new video "${videoTitle}" has been added to the course "${courseName}".`,
      metadata: {
        courseId: new mongoose.Types.ObjectId(courseId),
        videoId: new mongoose.Types.ObjectId(videoId),
        courseName,
        videoTitle,
      },
      isGlobal: true,
    });
  }

  /**
   * Create user notification records for a new user (for existing notifications)
   */
  async createNotificationsForNewUser(userId: string): Promise<void> {
    try {
      // Get all global notifications
      const globalNotifications = await Notification.find({ isGlobal: true }, { _id: 1 });

      if (globalNotifications.length === 0) {
        return;
      }

      const userNotifications = globalNotifications.map((notification) => ({
        userId: new mongoose.Types.ObjectId(userId),
        notificationId: notification._id,
        isRead: false,
      }));

      await UserNotification.insertMany(userNotifications, { ordered: false });
    } catch (error) {
      console.error('Failed to create notifications for new user:', error);
    }
  }
}

export const notificationService = new NotificationService();
