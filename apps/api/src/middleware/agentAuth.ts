import { Request, Response, NextFunction } from 'express';
import { auth0Management } from '../config/auth0';
import { prisma } from '../lib/prisma';

const USER_ID_CLAIM  = 'https://agentguardian.com/userId';
const AGENT_ID_CLAIM = 'https://agentguardian.com/agentId';
const AGENT_SCOPE    = 'agent:act';

export function requireAgentAuth(
  req: Request, res: Response, next: NextFunction
) {
  const payload = (req as any).auth?.payload;
  if (!payload) {
    return res.status(401).json({ error: 'No token presented' });
  }

  // Verify this is an M2M agent token, not a human user token
  const scopes = ((payload.scope as string) ?? '').split(' ');
  if (!scopes.includes(AGENT_SCOPE)) {
    return res.status(403).json({
      error: 'forbidden',
      message: 'This endpoint requires agent:act scope.',
    });
  }

  // Extract the userId the agent is acting on behalf of
  const userId  = payload[USER_ID_CLAIM] as string | undefined;
  const agentId = (payload[AGENT_ID_CLAIM] as string | undefined) || 'demo-agent-1';

  if (!userId) {
    return res.status(403).json({
      error: 'forbidden',
      message: 'Agent token is missing user binding. Configure the Auth0 M2M Action to inject the userId claim, or use the /agent/whoami endpoint for dynamic user resolution.',
    });
  }

  // Attach to request for downstream handlers
  (req as any).actingUserId = userId;
  (req as any).agentId = agentId;
  next();
}

// Helper to get acting user ID (works for both human and agent requests)
export function getActingUserId(req: Request): string {
  return (req as any).actingUserId ?? (req as any).auth?.payload?.sub;
}

export function getAgentId(req: Request): string | undefined {
  return (req as any).agentId;
}

async function resolveDevelopmentAgentUser(
  requestedAuth0UserId?: string,
  requestedEmail?: string
) {
  if (requestedAuth0UserId) {
    return prisma.user.findFirst({
      where: {
        OR: [
          { auth0UserId: requestedAuth0UserId },
          { id: requestedAuth0UserId },
        ],
      },
    });
  }

  if (!requestedEmail) {
    return null;
  }

  const directEmailMatch = await prisma.user.findFirst({
    where: {
      email: {
        equals: requestedEmail,
        mode: 'insensitive',
      },
    },
  });

  if (directEmailMatch) {
    return directEmailMatch;
  }

  const auth0Users = await auth0Management.usersByEmail.getByEmail({ email: requestedEmail });
  const auth0UserIds = (auth0Users.data || [])
    .map((user: any) => user.user_id)
    .filter(Boolean);

  if (auth0UserIds.length === 0) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      auth0UserId: {
        in: auth0UserIds,
      },
    },
  });
}
