// src/modules/notification/notification.model.ts
import { Schema, model, Document } from 'mongoose';
import { INotification } from './types';

export interface NotificationDocument extends INotification, Document {}

const notificationSchema = new Schema<NotificationDocument>(
  {
    type: {
      type: String,
      enum: ['new_video', 'course_update', 'system'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    metadata: {
      courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
      },
      videoId: {
        type: Schema.Types.ObjectId,
      },
      courseName: {
        type: String,
        trim: true,
      },
      videoTitle: {
        type: String,
        trim: true,
      },
    },
    isGlobal: {
      type: Boolean,
      default: true,
      index: true,
    },
    targetUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
    collection: 'notifications',
  },
);

// Indexes for performance
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ isGlobal: 1, createdAt: -1 });

// TTL index to automatically delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Notification = model<NotificationDocument>('Notification', notificationSchema);
