import { Router, Request, Response } from 'express';
import { requireAuth, getUserId } from '../middleware/auth';
import { getAuditLogs, getAuditStats } from '../services/auditService';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/v1/audit — Paginated audit log
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const auth0UserId = getUserId(req);
    if (!auth0UserId) return res.status(401).json({ error: 'No user ID' });

    const user = await prisma.user.findUnique({ where: { auth0UserId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { service, tier, status, from, to, limit, offset } = req.query;

    const result = await getAuditLogs(user.id, {
      service: service as string,
      tier: tier as string,
      status: status as string,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// GET /api/v1/audit/stats — Summary statistics
router.get('/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const auth0UserId = getUserId(req);
    if (!auth0UserId) return res.status(401).json({ error: 'No user ID' });

    const user = await prisma.user.findUnique({ where: { auth0UserId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const stats = await getAuditStats(user.id);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// GET /api/v1/audit/:auditLogId — Single entry
router.get('/:auditLogId', requireAuth, async (req: Request, res: Response) => {
  try {
    const auth0UserId = getUserId(req);
    if (!auth0UserId) return res.status(401).json({ error: 'No user ID' });

    const user = await prisma.user.findUnique({ where: { auth0UserId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const log = await prisma.auditLog.findFirst({
      where: { id: req.params.auditLogId, userId: user.id },
    });

    if (!log) return res.status(404).json({ error: 'Audit log entry not found' });
    res.json(log);
  } catch (err: any) {
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

export default router;
