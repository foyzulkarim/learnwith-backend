// src/modules/notification/user-notification.model.ts
import { Schema, model, Document } from 'mongoose';
import { IUserNotification } from './types';

export interface UserNotificationDocument extends IUserNotification, Document {}

const userNotificationSchema = new Schema<UserNotificationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    notificationId: {
      type: Schema.Types.ObjectId,
      ref: 'Notification',
      required: true,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'usernotifications',
  },
);

// Compound indexes for efficient queries
userNotificationSchema.index({ userId: 1, isRead: 1 });
userNotificationSchema.index({ userId: 1, createdAt: -1 });
userNotificationSchema.index({ notificationId: 1 });

// Ensure unique combination of userId and notificationId
userNotificationSchema.index({ userId: 1, notificationId: 1 }, { unique: true });

// TTL index to automatically delete user notifications older than 90 days
userNotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const UserNotification = model<UserNotificationDocument>(
  'UserNotification',
  userNotificationSchema,
);
