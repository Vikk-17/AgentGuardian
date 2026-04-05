import webpush from 'web-push';
import { env } from '../config/env';
import { logger } from './logger';

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:team@agentguardian.com',
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
  logger.info('Web Push: VAPID keys configured');
} else {
  logger.warn('Web Push: VAPID keys not configured — push notifications disabled');
}

export interface NudgeNotificationPayload {
  displaySummary: string;
  jobId: string;
  expiresAt: Date;
}

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  pendingAction: NudgeNotificationPayload
): Promise<void> {
  if (!env.VAPID_PUBLIC_KEY) {
    logger.warn('Web Push: skipped — VAPID not configured');
    return;
  }

  const payload = JSON.stringify({
    title: 'Agent Guardian — Approval Required',
    body: pendingAction.displaySummary,
    jobId: pendingAction.jobId,
    expiry: pendingAction.expiresAt.toISOString(),
    url: `${env.FRONTEND_URL}/dashboard?approve=${pendingAction.jobId}`,
  });

  try {
    await webpush.sendNotification(subscription, payload);
    logger.info('Web Push: notification sent', { jobId: pendingAction.jobId });
  } catch (err: any) {
    logger.error('Web Push: failed to send', { error: err.message });
  }
}

export { webpush };
