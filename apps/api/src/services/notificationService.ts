import { prisma } from '../lib/prisma';
import { sendPushNotification } from '../lib/webPush';
import { logger } from '../lib/logger';
import type { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function setSocketIO(socketIO: SocketIOServer) {
  io = socketIO;
}

// Helper to convert database userId to Auth0 userId for socket rooms
async function getAuth0UserId(dbUserId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: dbUserId },
    select: { auth0UserId: true },
  });
  return user?.auth0UserId || null;
}

export interface NotifyParams {
  userId: string;
  pendingAction: {
    id: string;
    displaySummary: string;
    expiresAt: Date;
    service: string;
    actionType: string;
    tier: string;
  };
}

// Three-layer notification approach
export async function notifyUser(params: NotifyParams) {
  const { userId, pendingAction } = params;

  // Get Auth0 user ID for socket room
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { auth0UserId: true, pushSubscription: true },
  });

  if (!user) {
    logger.warn('User not found for notification', { userId });
    return;
  }

  // Layer 1: Socket.io — instant if dashboard tab is open
  if (io) {
    io.to(user.auth0UserId).emit('nudge:request', { pendingAction });
    logger.debug('Notification sent via Socket.io', { auth0UserId: user.auth0UserId, jobId: pendingAction.id });
  }

  // Layer 2: Web Push — instant if browser is open (any tab)
  try {

    if (user?.pushSubscription) {
      await sendPushNotification(user.pushSubscription as any, {
        displaySummary: pendingAction.displaySummary,
        jobId: pendingAction.id,
        expiresAt: pendingAction.expiresAt,
      });
    }
  } catch (err: any) {
    logger.warn('Web Push notification failed', { error: err.message });
  }

  // Layer 3: Slack DM fallback handled separately via Token Vault
}

// Emit activity feed update
export async function emitActivityUpdate(userId: string, auditLog: any) {
  if (!io) return;
  const auth0UserId = await getAuth0UserId(userId);
  if (auth0UserId) {
    io.to(auth0UserId).emit('activity:new', { auditLog });
  }
}

// Emit nudge resolution
export async function emitNudgeResolved(userId: string, jobId: string, status: string, resolvedBy?: string) {
  if (!io) return;
  const auth0UserId = await getAuth0UserId(userId);
  if (auth0UserId) {
    io.to(auth0UserId).emit('nudge:resolved', { jobId, status, resolvedBy });
  }
}

// Emit nudge expiry
export async function emitNudgeExpired(userId: string, jobId: string) {
  if (!io) return;
  const auth0UserId = await getAuth0UserId(userId);
  if (auth0UserId) {
    io.to(auth0UserId).emit('nudge:expired', { jobId });
  }
}

// Emit step-up required
export async function emitStepUpRequired(userId: string, jobId: string, challengeUrl: string) {
  if (!io) return;
  const auth0UserId = await getAuth0UserId(userId);
  if (auth0UserId) {
    io.to(auth0UserId).emit('stepup:required', { jobId, challengeUrl });
    logger.debug('Step-up required emitted', { auth0UserId, jobId });
  }
}

// Emit step-up completed
export async function emitStepUpCompleted(userId: string, jobId: string, auditLog: any) {
  if (!io) return;
  const auth0UserId = await getAuth0UserId(userId);
  if (auth0UserId) {
    io.to(auth0UserId).emit('stepup:completed', { jobId, auditLog });
  }
}

// Emit connection revoked
export async function emitConnectionRevoked(userId: string, service: string) {
  if (!io) return;
  const auth0UserId = await getAuth0UserId(userId);
  if (auth0UserId) {
    io.to(auth0UserId).emit('connection:revoked', { service });
  }
}
