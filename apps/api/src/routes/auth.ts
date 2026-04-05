import { Router, Request, Response } from 'express';
import { requireAuth, getUserId } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const router = Router();

// GET /api/v1/health — Health check (no auth)
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'agent-guardian-api' });
});

// GET /api/v1/auth/me — Get current user profile
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const auth0UserId = getUserId(req);
    if (!auth0UserId) {
      return res.status(401).json({ error: 'No user ID in token' });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { auth0UserId },
      include: {
        connections: { where: { status: 'ACTIVE' } },
        _count: { select: { auditLogs: true, pendingActions: true } },
      },
    });

    if (!user) {
      // Extract info from JWT claims
      const payload = (req as any).auth?.payload;
      const created = await prisma.user.create({
        data: {
          auth0UserId,
          email: payload?.email || payload?.[`https://agentguardian.com/email`] || `${auth0UserId}@auth0.user`,
          displayName: payload?.name || payload?.nickname || null,
          avatarUrl: payload?.picture || null,
        },
      });
      logger.info('New user created from Auth0', { userId: created.id, auth0UserId });

      // Re-fetch with includes so the response shape is consistent
      user = await prisma.user.findUnique({
        where: { auth0UserId },
        include: {
          connections: { where: { status: 'ACTIVE' } },
          _count: { select: { auditLogs: true, pendingActions: true } },
        },
      });
    } else {
      // Touch updatedAt to mark this user as the currently active one
      await prisma.user.update({
        where: { auth0UserId },
        data: { updatedAt: new Date() },
      });
    }

    res.json({
      id: user!.id,
      auth0UserId: user!.auth0UserId,
      email: user!.email,
      displayName: user!.displayName,
      avatarUrl: user!.avatarUrl,
      connections: user!.connections ?? [],
      stats: user!._count ?? { auditLogs: 0, pendingActions: 0 },
      createdAt: user!.createdAt,
    });
  } catch (err: any) {
    logger.error('Error in /auth/me', { error: err.message });
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// POST /api/v1/auth/logout — Invalidate server-side session
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  // In this architecture, the JWT is stateless — client should call Auth0 logout
  logger.info('User logout', { userId: getUserId(req) });
  res.json({ status: 'logged_out' });
});

// POST /api/v1/auth/push-subscription — Register Web Push subscription
router.post('/push-subscription', requireAuth, async (req: Request, res: Response) => {
  try {
    const auth0UserId = getUserId(req);
    if (!auth0UserId) return res.status(401).json({ error: 'No user ID' });

    await prisma.user.update({
      where: { auth0UserId },
      data: { pushSubscription: req.body },
    });

    res.json({ status: 'subscription_saved' });
  } catch (err: any) {
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

export default router;
