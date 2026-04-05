import { executeGmailAction } from './gmail';
import { executeGithubAction } from './github';
import { executeSlackAction } from './slack';
import { executeNotionAction } from './notion';
import { logger } from '../../lib/logger';

export interface ExecutionResult {
  success: boolean;
  data?: any;
  metadata?: Record<string, unknown>;
}

export async function executeServiceAction(
  service: 'gmail' | 'github' | 'slack' | 'notion',
  actionType: string,
  accessToken: string,
  payload?: Record<string, unknown>
): Promise<ExecutionResult> {
  logger.info('Executing service action', { service, actionType });

  switch (service) {
    case 'gmail':
      return executeGmailAction(actionType, accessToken, payload);
    case 'github':
      return executeGithubAction(actionType, accessToken, payload);
    case 'slack':
      return executeSlackAction(actionType, accessToken, payload);
    case 'notion':
      return executeNotionAction(actionType, accessToken, payload);
    default:
      throw new Error(`Unknown service: ${service}`);
  }
}
