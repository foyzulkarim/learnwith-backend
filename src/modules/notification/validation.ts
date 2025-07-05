// src/modules/notification/validation.ts
import { FastifySchema } from 'fastify';
import { z } from 'zod';

// Zod schemas for controller validation
export const createNotificationSchema = z.object({
  type: z.enum(['new_video', 'course_update', 'system']),
  title: z.string().min(1).max(200).trim(),
  message: z.string().min(1).max(1000).trim(),
  metadata: z
    .object({
      courseId: z.string().optional(),
      videoId: z.string().optional(),
      courseName: z.string().optional(),
      videoTitle: z.string().optional(),
    })
    .optional(),
  isGlobal: z.boolean().default(true),
  targetUsers: z.array(z.string()).optional(),
});

export const getNotificationsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export const markAsReadParamsSchema = z.object({
  id: z.string().min(1),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;
export type MarkAsReadParams = z.infer<typeof markAsReadParamsSchema>;

// Common response schemas
const successResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
  },
};

// Fastify schemas for route validation
export const getNotificationsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'number', minimum: 1, default: 1 },
      limit: { type: 'number', minimum: 1, maximum: 50, default: 10 },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            notifications: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  type: { type: 'string', enum: ['new_video', 'course_update', 'system'] },
                  title: { type: 'string' },
                  message: { type: 'string' },
                  metadata: { type: 'object' },
                  createdAt: { type: 'string', format: 'date-time' },
                  isRead: { type: 'boolean' },
                  readAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            total: { type: 'number' },
            hasMore: { type: 'boolean' },
            page: { type: 'number' },
            limit: { type: 'number' },
          },
        },
      },
    },
  },
};

export const getUnreadCountSchema: FastifySchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            count: { type: 'number' },
          },
        },
      },
    },
  },
};

export const markAsReadSchema: FastifySchema = {
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
  response: {
    200: successResponseSchema,
  },
};

export const markAllAsReadSchema: FastifySchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            updatedCount: { type: 'number' },
          },
        },
      },
    },
  },
};
