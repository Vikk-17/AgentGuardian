import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

// Global error handler
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log the error
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle express-oauth2-jwt-bearer errors (maps to correct 401)
  if (err.name === 'UnauthorizedError' || (err as any).status === 401) {
    return res.status(401).json({
      error: 'invalid_token',
      message: err.message || 'Invalid or expired token.',
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      return res.status(409).json({
        error: 'conflict',
        message: 'A record with this value already exists.',
      });
    }
    if (prismaErr.code === 'P2025') {
      return res.status(404).json({
        error: 'not_found',
        message: 'Record not found.',
      });
    }
  }

  // Default 500
  return res.status(500).json({
    error: 'internal_server_error',
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'An unexpected error occurred.',
  });
}
