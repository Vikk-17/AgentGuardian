import { Router, Request, Response } from 'express';
import { requireAuth, getUserId } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { DEFAULT_TIER_MAP, ACTION_DESCRIPTIONS, SERVICE_ACTIONS } from '@agent-guardian/shared';
import { z } from 'zod';

const router = Router();

// GET /api/v1/permissions — Full permission config for user
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const auth0UserId = getUserId(req);
    if (!auth0UserId) return res.status(401).json({ error: 'No user ID' });

    const user = await prisma.user.findUnique({ where: { auth0UserId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get user's custom configs
    const configs = await prisma.permissionConfig.findMany({
      where: { userId: user.id },
    });

    // Build full permission view with defaults + customizations
    const allPermissions: any[] = [];
    const services = ['GMAIL', 'GITHUB', 'SLACK', 'NOTION'] as const;

    for (const service of services) {
      const actions = SERVICE_ACTIONS[service] || [];
      for (const actionType of actions) {
        const customConfig = configs.find((c: any) => c.service === service && c.actionType === actionType);
        const defaultTier = DEFAULT_TIER_MAP[service]?.[actionType] || 'STEP_UP';

        allPermissions.push({
          service,
          actionType,
          description: ACTION_DESCRIPTIONS[actionType] || actionType,
          currentTier: customConfig?.tier || defaultTier,
          defaultTier,
          isCustom: !!customConfig,
          configId: customConfig?.id || null,
        });
      }
    }

    res.json(allPermissions);
  } catch (err: any) {
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// PUT /api/v1/permissions — Bulk upsert
const bulkUpsertSchema = z.object({
  configs: z.array(z.object({
    service: z.enum(['GMAIL', 'GITHUB', 'SLACK', 'NOTION']),
    actionType: z.string().min(1).max(100),
    tier: z.enum(['AUTO', 'NUDGE', 'STEP_UP']),
  })),
});

router.put('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const auth0UserId = getUserId(req);
    if (!auth0UserId) return res.status(401).json({ error: 'No user ID' });

    const result = bulkUpsertSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid request', details: result.error.issues });
    }

    const user = await prisma.user.findUnique({ where: { auth0UserId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Upsert each config
    const upserted = await Promise.all(
      result.data.configs.map((config) =>
        prisma.permissionConfig.upsert({
          where: {
            userId_service_actionType: {
              userId: user.id,
              service: config.service as any,
              actionType: config.actionType,
            },
          },
          update: { tier: config.tier as any },
          create: {
            userId: user.id,
            service: config.service as any,
            actionType: config.actionType,
            tier: config.tier as any,
          },
        })
      )
    );

    logger.info('Permissions updated', { userId: user.id, count: upserted.length });
    res.json({ updated: upserted.length, configs: upserted });
  } catch (err: any) {
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// PUT /api/v1/permissions/:service/:action — Single upsert
const singleUpsertSchema = z.object({
  tier: z.enum(['AUTO', 'NUDGE', 'STEP_UP']),
});

router.put('/:service/:action', requireAuth, async (req: Request, res: Response) => {
  try {
    const auth0UserId = getUserId(req);
    if (!auth0UserId) return res.status(401).json({ error: 'No user ID' });

    const result = singleUpsertSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid request', details: result.error.issues });
    }

    const user = await prisma.user.findUnique({ where: { auth0UserId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { service, action } = req.params;
    const serviceUpper = service.toUpperCase() as any;
    const actionType = action.includes('.') ? action : `${service.toLowerCase()}.${action}`;

    const config = await prisma.permissionConfig.upsert({
      where: {
        userId_service_actionType: { userId: user.id, service: serviceUpper, actionType },
      },
      update: { tier: result.data.tier as any },
      create: {
        userId: user.id,
        service: serviceUpper,
        actionType,
        tier: result.data.tier as any,
      },
    });

    logger.info('Single permission updated', { userId: user.id, service, actionType, tier: result.data.tier });
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// GET /api/v1/permissions/defaults — System default tier mappings
router.get('/defaults', requireAuth, (_req: Request, res: Response) => {
  const defaults: any[] = [];
  for (const [service, actions] of Object.entries(DEFAULT_TIER_MAP)) {
    for (const [actionType, tier] of Object.entries(actions as Record<string, string>)) {
      defaults.push({
        service,
        actionType,
        tier,
        description: ACTION_DESCRIPTIONS[actionType] || actionType,
      });
    }
  }
  res.json(defaults);
});

// DELETE /api/v1/permissions/:service — Reset a service's permissions to system defaults
router.delete('/:service', requireAuth, async (req: Request, res: Response) => {
  try {
    const auth0UserId = getUserId(req);
    if (!auth0UserId) return res.status(401).json({ error: 'No user ID' });

    const user = await prisma.user.findUnique({ where: { auth0UserId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const serviceUpper = req.params.service.toUpperCase() as any;

    const { count } = await prisma.permissionConfig.deleteMany({
      where: { userId: user.id, service: serviceUpper },
    });

    logger.info('Permissions reset to defaults', { userId: user.id, service: serviceUpper, deleted: count });
    res.json({ reset: true, service: serviceUpper, deleted: count });
  } catch (err: any) {
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

export default router;
