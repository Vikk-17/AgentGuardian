import { waitForApproval } from '../guardian/waitForApproval';

export async function executeGuardianAction(
  token: string,
  apiUrl: string,
  userId: string,
  args: { service: string; actionType: string; payload: any; displaySummary: string; [key: string]: any }
) {
  // LLM hallucination safeguard: If the LLM places parameters at the root instead of inside 'payload'
  if (!args.payload) {
    args.payload = {};
    if (args.repo) args.payload.repo = args.repo;
    if (args.owner) args.payload.owner = args.owner;
    if (args.branch) args.payload.branch = args.branch;
  }

  console.log(`📦 Payload: ${JSON.stringify(args.payload)}`);
  
  const reqBody = {
    service: args.service,
    actionType: args.actionType,
    payload: args.payload,
    displaySummary: args.displaySummary,
  };

  const res = await fetch(`${apiUrl}/api/v1/agent/action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(reqBody)
  });

  if (!res.ok) {
    let errText = await res.text();
    try { errText = JSON.parse(errText).message || errText; } catch { /* ignore parse errors */ }
    return `Error from Agent Guardian API: ${res.status} - ${errText}`;
  }

  const data = await res.json();
  
  if (data.status === 'EXECUTED') {
    console.log(`✅ Action executed immediately (Tier: ${data.tier})`);
    return `Success: ${JSON.stringify(data.data)}`;
  }
  
  if (data.status === 'FAILED') {
    console.log(`❌ Action failed: ${data.error}`);
    return `Error: ${data.error}`;
  }
  
  if (data.status === 'PENDING_APPROVAL' || data.status === 'AWAITING_MFA') {
    const tier = data.tier || 'UNKNOWN';
    console.log(`⏸️  Action requires approval (Tier: ${tier})`);
    
    if (tier === 'STEP_UP') {
      console.log(`   🔴 This is a HIGH-RISK action requiring MFA verification`);
      console.log(`   📱 Open the dashboard and complete MFA to proceed`);
      console.log(`   ⏳ Waiting up to 5 minutes...`);
    } else {
      console.log(`   🟡 Waiting for user approval via Dashboard (60 seconds)...`);
    }
    
    try {
      const finalResult = await waitForApproval(data.jobId, token);
      
      if (finalResult.status === 'APPROVED' || finalResult.status === 'STEP_UP_VERIFIED' || finalResult.status === 'EXECUTED') {
        console.log(`✅ Action was approved and executed.`);
        return `Success: ${JSON.stringify(finalResult.data || finalResult)}`;
      } else {
        console.log(`❌ Action ${finalResult.status}: ${finalResult.error || 'No reason provided'}`);
        return `Execution stopped: ${finalResult.status}`;
      }
    } catch (e: any) {
      console.log(`❌ Approval failed: ${e.message}`);
      return `Execution stopped: ${e.message}`;
    }
  }

  return `Unknown status returned from Guardian: ${data.status}`;
}
