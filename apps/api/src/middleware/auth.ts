import { auth } from 'express-oauth2-jwt-bearer';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

// JWT verification middleware — returns 401 only for missing/invalid/expired tokens
// Does NOT check scopes — scope checks return 403 separately
export const requireAuth = auth({
  audience: env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${env.AUTH0_DOMAIN}`,
  tokenSigningAlg: 'RS256',
  jwksUri: `https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  cacheMaxAge: 5 * 60 * 1000,
});

// Scope guard — returns 403, never 401
export function requireScope(scope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const payload = (req as any).auth?.payload;
    const scopes = ((payload?.scope as string) ?? '').split(' ');

    if (!scopes.includes(scope)) {
      return res.status(403).json({
        error: 'insufficient_scope',
        message: `Required scope '${scope}' not present in token.`,
      });
    }
    next();
  };
}

// Extract user ID from JWT payload (human user token)
export function getUserId(req: Request): string | undefined {
  return (req as any).auth?.payload?.sub as string | undefined;
}
