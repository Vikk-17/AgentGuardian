// agent/src/auth/resolveActingUser.ts
// Dynamically resolves the Auth0 user ID the agent should act on behalf of.
// Calls GET /api/v1/agent/whoami — no hardcoded user ID needed in .env.

const GUARDIAN_API = process.env.GUARDIAN_API_URL || 'http://localhost:3001';

export interface ActingUser {
  auth0UserId: string;
  email: string;
  name: string | null;
}

export async function resolveActingUser(agentToken: string): Promise<ActingUser> {
  const resp = await fetch(`${GUARDIAN_API}/api/v1/agent/whoami`, {
    headers: { Authorization: `Bearer ${agentToken}` },
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(
      `Could not resolve acting user (${resp.status}): ${(err as any).message || resp.statusText}. ` +
      `Make sure you have logged into the dashboard at least once to create your user profile.`
    );
  }

  return resp.json() as Promise<ActingUser>;
}
