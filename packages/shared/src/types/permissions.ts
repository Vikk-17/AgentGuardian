import { ActionTier, ServiceType } from './actions';

export interface PermissionConfig {
  id: string;
  userId: string;
  service: ServiceType;
  actionType: string;
  tier: ActionTier;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionConfigInput {
  service: ServiceType;
  actionType: string;
  tier: ActionTier;
}

export interface PermissionRule {
  service: ServiceType;
  actionType: string;
  description: string;
  currentTier: ActionTier;
  defaultTier: ActionTier;
  isCustom: boolean;
}

export interface SocketEvents {
  'activity:new': { auditLog: import('./audit').AuditLogEntry };
  'nudge:request': { pendingAction: import('./audit').PendingActionEntry };
  'nudge:expired': { jobId: string };
  'nudge:resolved': { jobId: string; status: string; resolvedBy?: string };
  'stepup:required': { jobId: string; challengeUrl: string };
  'stepup:completed': { jobId: string; auditLog: import('./audit').AuditLogEntry };
  'connection:revoked': { service: ServiceType };
}
