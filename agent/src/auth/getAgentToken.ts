// M2M Client Credentials Flow

interface AgentTokenCache {
  token: string;
  expiresAt: number;
}

let cache: AgentTokenCache | null = null;

export async function getAgentToken(): Promise<string> {
  const now = Date.now();
  // Refresh 60s before expiry to avoid clock-skew failures
  if (cache && cache.expiresAt - now > 60_000) {
    return cache.token;
  }

  const response = await fetch(
    `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: process.env.AGENT_AUTH0_CLIENT_ID,
        client_secret: process.env.AGENT_AUTH0_CLIENT_SECRET,
        audience: process.env.AUTH0_AUDIENCE,
        scope: 'agent:act',
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Agent token fetch failed: ${response.status}`);
  }

  const data = await response.json();
  cache = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  console.log(`🔑 Agent token acquired, expires in ${data.expires_in}s`);
  return cache.token;
}
