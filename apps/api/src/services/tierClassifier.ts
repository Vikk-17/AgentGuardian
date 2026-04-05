import { prisma } from '../lib/prisma';
import { ActionTier, DEFAULT_TIER_MAP } from '@agent-guardian/shared';
import { logger } from '../lib/logger';

export async function classifyTier(
  userId: string,
  service: string,
  actionType: string
): Promise<ActionTier> {
  // 1. Check user's explicit configuration
  const config = await prisma.permissionConfig.findUnique({
    where: {
      userId_service_actionType: {
        userId,
        service: service.toUpperCase() as any,
        actionType,
      },
    },
  });

  if (config) {
    logger.debug('Tier classified from user config', {
      userId, service, actionType, tier: config.tier,
    });
    return config.tier as ActionTier;
  }

  // 2. Fall back to system defaults
  const serviceKey = service.toUpperCase();
  const defaultTier = DEFAULT_TIER_MAP[serviceKey]?.[actionType];
  if (defaultTier) {
    logger.debug('Tier classified from defaults', {
      userId, service, actionType, tier: defaultTier,
    });
    return defaultTier;
  }

  // 3. Unknown action: default to STEP_UP (fail-safe)
  logger.warn('Unknown action type — defaulting to STEP_UP', {
    userId, service, actionType,
  });
  return ActionTier.STEP_UP;
}
