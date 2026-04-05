import { createRemoteJWKSet } from 'jose';
import { env } from '../config/env';

// createRemoteJWKSet caches the JWKS automatically.
// The cache is invalidated on key rotation (Auth0 sends a new kid).
export const JWKS = createRemoteJWKSet(
  new URL(`https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`),
  {
    cacheMaxAge: 5 * 60 * 1000,      // 5 minutes — Auth0 recommended TTL
    cooldownDuration: 30 * 1000,      // 30s between refetch attempts on cache miss
  }
);
