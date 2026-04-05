import { ActionTier, ServiceType } from './actions';

export enum AuditStatus {
  EXECUTED = 'EXECUTED',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
  STEP_UP_VERIFIED = 'STEP_UP_VERIFIED',
  PENDING = 'PENDING',
}

export enum PendingStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  EXPIRED = 'EXPIRED',
}

export enum ConnectionStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  agentId?: string;
  connectionId?: string;
  service: ServiceType;
  actionType: string;
  tier: ActionTier;
  status: AuditStatus;
  payloadHash?: string;
  metadata?: Record<string, unknown>;
  approvedByUserId?: string;
  approvedByIp?: string;
  stepUpVerified: boolean;
  executedAt: string;
}

export interface PendingActionEntry {
  id: string;
  userId: string;
  agentId: string;
  service: ServiceType;
  actionType: string;
  tier: ActionTier;
  status: PendingStatus;
  payloadHash: string;
  displaySummary: string;
  bullJobId?: string;
  expiresAt: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedByUserId?: string;
  resolvedByIp?: string;
  resolvedByDevice?: string;
  stepUpVerified: boolean;
}

export interface ServiceConnectionEntry {
  id: string;
  userId: string;
  service: ServiceType;
  status: ConnectionStatus;
  connectedAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
}

export interface AuditStats {
  totalActions: number;
  byTier: Record<ActionTier, number>;
  byService: Record<ServiceType, number>;
  byStatus: Record<AuditStatus, number>;
  last7DaysTrend: { date: string; count: number }[];
}
