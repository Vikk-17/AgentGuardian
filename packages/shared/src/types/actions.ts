export enum ServiceType {
  GMAIL = 'GMAIL',
  GITHUB = 'GITHUB',
  SLACK = 'SLACK',
  NOTION = 'NOTION',
}

export enum ActionTier {
  AUTO = 'AUTO',
  NUDGE = 'NUDGE',
  STEP_UP = 'STEP_UP',
}

// Submitted by the agent when requesting an action
export interface ActionIntent {
  service: ServiceType;
  actionType: string;
  payload?: Record<string, unknown>;
  displaySummary: string;
}

export type ActionResponseStatus =
  | 'EXECUTED'
  | 'PENDING_APPROVAL'
  | 'AWAITING_MFA'
  | 'STEP_UP_VERIFIED'
  | 'DENIED'
  | 'EXPIRED'
  | 'FAILED';

export interface ActionResponse {
  tier: ActionTier;
  status: ActionResponseStatus;
  auditLogId?: string;
  jobId?: string;
  expiresAt?: string;
  challengeUrl?: string;
  error?: string;
  data?: unknown;
}

export type NudgeStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'DENIED'
  | 'EXPIRED'
  | 'EXECUTED'
  | 'FAILED';

export const SERVICE_CONNECTION_MAP: Record<ServiceType, string> = {
  [ServiceType.GMAIL]: 'google-gmail',
  [ServiceType.GITHUB]: 'github',
  [ServiceType.SLACK]: 'slack',
  [ServiceType.NOTION]: 'notion',
};

export const SERVICE_DISPLAY_NAMES: Record<ServiceType, string> = {
  [ServiceType.GMAIL]: 'Gmail',
  [ServiceType.GITHUB]: 'GitHub',
  [ServiceType.SLACK]: 'Slack',
  [ServiceType.NOTION]: 'Notion',
};

export const TIER_EMOJI: Record<ActionTier, string> = {
  [ActionTier.AUTO]: '🟢',
  [ActionTier.NUDGE]: '🟡',
  [ActionTier.STEP_UP]: '🔴',
};
