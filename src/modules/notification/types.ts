// src/modules/notification/types.ts
import mongoose from 'mongoose';

export interface INotification {
  type: 'new_video' | 'course_update' | 'system';
  title: string;
  message: string;
  metadata: {
    courseId?: string;
    moduleId?: string;
    videoId?: string;
    courseName?: string;
    videoTitle?: string;
    isExternal?: boolean;
    externalUrl?: string;
    [key: string]: any;
  };
  createdAt: Date;
  isGlobal: boolean;
  targetUsers?: string[];
}

export interface IUserNotification {
  userId: mongoose.Types.ObjectId;
  notificationId: mongoose.Types.ObjectId;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface NotificationResponse {
  notifications: Array<INotification & { isRead: boolean; readAt?: Date }>;
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface CreateNotificationData {
  type: INotification['type'];
  title: string;
  message: string;
  metadata?: INotification['metadata'];
  isGlobal?: boolean;
  targetUsers?: (string | mongoose.Types.ObjectId)[];
}

export type NotificationType = INotification['type'];
