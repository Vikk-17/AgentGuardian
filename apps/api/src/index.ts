import { createServer } from 'http';
import app from './app';
import { setupSocketIO } from './socket';
import { startNudgeWorker } from './workers/nudgeWorker';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

async function main() {
  // Verify database connection
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (err: any) {
    logger.error('Failed to connect to database', { error: err.message });
    process.exit(1);
  }

  // Create HTTP server
  const httpServer = createServer(app);

  // Setup Socket.io
  setupSocketIO(httpServer);

  // Start BullMQ workers
  startNudgeWorker();

  // Start server
  httpServer.listen(env.PORT, () => {
    logger.info(`🛡️  Agent Guardian API running on port ${env.PORT}`);
    logger.info(`   Environment: ${env.NODE_ENV}`);
    logger.info(`   Frontend:    ${env.FRONTEND_URL}`);
    logger.info(`   Auth0:       ${env.AUTH0_DOMAIN}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    httpServer.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  logger.error('Fatal startup error', { error: err.message });
  process.exit(1);
});
