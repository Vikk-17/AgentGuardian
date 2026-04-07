import { Request, Response, NextFunction } from 'express';

// Helper to get acting user ID (works for both human and agent requests)
export function getActingUserId(req: Request): string {
  return (req as any).actingUserId ?? (req as any).auth?.payload?.sub;
}

export function getAgentId(req: Request): string | undefined {
  return (req as any).agentId;
}
