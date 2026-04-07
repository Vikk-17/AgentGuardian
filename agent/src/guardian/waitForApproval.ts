// Polling protocol with exponential backoff

const GUARDIAN_API = process.env.GUARDIAN_API_URL || 'http://localhost:3001';

type ApprovalStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'STEP_UP_VERIFIED'
  | 'DENIED'
  | 'EXPIRED'
  | 'EXECUTED'
  | 'FAILED';

interface PollResult {
  status: ApprovalStatus;
  auditLogId?: string;
  error?: string;
  data?: any;
}

export async function waitForApproval(
  jobId: string,
  agentToken: string,
  timeoutMs: number = 5 * 60 * 1000, // 5 minutes for STEP_UP
  intervalMs: number = 3_000
): Promise<PollResult> {
  const deadline = Date.now() + timeoutMs;
  let backoff = intervalMs;

  while (Date.now() < deadline) {
    await sleep(backoff);

    const resp = await fetch(
      `${GUARDIAN_API}/api/v1/agent/action/${jobId}/status`,
      { headers: { Authorization: `Bearer ${agentToken}` } }
    );

    if (!resp.ok) {
      throw new Error(`Status poll failed: ${resp.status}`);
    }

    const data: PollResult = await resp.json();

    // Terminal states - stop polling
    if (['APPROVED', 'STEP_UP_VERIFIED', 'EXECUTED', 'DENIED', 'EXPIRED', 'FAILED'].includes(data.status)) {
      return data;
    }

    // Still pending - continue polling
    if (data.status === 'PENDING_APPROVAL') {
      // Exponential backoff: 3s → 5s → 8s → cap at 10s
      backoff = Math.min(backoff * 1.5, 10_000);
      continue;
    }

    // Unknown status
    throw new Error(`Unknown status: ${data.status}`);
  }

  return { status: 'EXPIRED', error: 'Client-side timeout exceeded' };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
