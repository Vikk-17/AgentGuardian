import { prisma } from '../lib/prisma';
import { sendPushNotification } from '../lib/webPush';
import { logger } from '../lib/logger';
import type { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function setSocketIO(socketIO: SocketIOServer) {
  io = socketIO;
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

  // Layer 1: Socket.io — instant if dashboard tab is open
  if (io) {
    io.to(userId).emit('nudge:request', { pendingAction });
    logger.debug('Notification sent via Socket.io', { userId, jobId: pendingAction.id });
  }

  // Layer 2: Web Push — instant if browser is open (any tab)
  try {
    const user = await prisma.user.findUnique({
      where: { auth0UserId: userId },
      select: { pushSubscription: true },
    });

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
export function emitActivityUpdate(userId: string, auditLog: any) {
  if (io) {
    io.to(userId).emit('activity:new', { auditLog });
  }
}

// Emit nudge resolution
export function emitNudgeResolved(userId: string, jobId: string, status: string, resolvedBy?: string) {
  if (io) {
    io.to(userId).emit('nudge:resolved', { jobId, status, resolvedBy });
  }
}

// Emit nudge expiry
export function emitNudgeExpired(userId: string, jobId: string) {
  if (io) {
    io.to(userId).emit('nudge:expired', { jobId });
  }
}

// Emit step-up required
export function emitStepUpRequired(userId: string, jobId: string, challengeUrl: string) {
  if (io) {
    io.to(userId).emit('stepup:required', { jobId, challengeUrl });
  }
}

// Emit step-up completed
export function emitStepUpCompleted(userId: string, jobId: string, auditLog: any) {
  if (io) {
    io.to(userId).emit('stepup:completed', { jobId, auditLog });
  }
}

// Emit connection revoked
export function emitConnectionRevoked(userId: string, service: string) {
  if (io) {
    io.to(userId).emit('connection:revoked', { service });
  }
}
