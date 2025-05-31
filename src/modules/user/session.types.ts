import { Types } from 'mongoose';

// Base session properties
export interface SessionBase {
  userId: Types.ObjectId;
  refreshToken: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt: Date;
  isActive: boolean;
  updatedAt: Date;
}

// Lean session document (plain JavaScript object from .lean() queries)
export interface SessionLean extends SessionBase {
  _id: Types.ObjectId;
  __v: number;
}

// Session info for public API responses
export interface SessionInfo {
  id: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastUsedAt: Date;
}

// Session context for correlation tracking
export interface SessionContext {
  sessionId: string;
  userId: string;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt: Date;
  lastUsedAt: Date;
}
