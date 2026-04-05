# Agent Guardian CLI

Interactive AI agent that acts on your behalf with human-in-the-loop approval.

## Quick Start

```bash
# 1. Make sure API and Dashboard are running
npm run dev  # from project root

# 2. Log into dashboard to create your user profile
# Visit http://localhost:5173 and sign in with Auth0

# 3. Start the agent
npm run dev -w agent

# 4. Chat with the agent!
User> list my GitHub repositories
User> create an issue in my-repo
User> exit
```

## Scripts

- **`npm run dev`** - Run agent (stable, no auto-reload)
- **`npm run start`** - Same as dev
- **`npm run dev:watch`** - Run with auto-reload (for development only, may flicker)

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://api.agentguardian.com
AGENT_AUTH0_CLIENT_ID=your_m2m_client_id
AGENT_AUTH0_CLIENT_SECRET=your_m2m_client_secret

# API Configuration
GUARDIAN_API_URL=http://localhost:3001

# LLM Configuration
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openai/gpt-4o-mini
```

## How It Works

1. **Authentication**: Agent uses M2M token to authenticate with API
2. **User Resolution**: Automatically acts on behalf of most recently logged-in user
3. **Action Execution**: Sends actions to Guardian API with tier-based approval
4. **Approval Flow**: Waits for human approval for NUDGE/STEP_UP actions

## Supported Actions

### GitHub
- `github.read_repositories` - List your repos
- `github.read_issues` - List issues in a repo
- `github.read_prs` - List pull requests
- `github.read_code` - Read file contents
- `github.read_branches` - List branches
- `github.create_issue` - Create new issue (NUDGE)
- `github.comment_issue` - Comment on issue/PR (NUDGE)
- `github.open_pr` - Create pull request (NUDGE)
- `github.merge_pr` - Merge pull request (STEP_UP)
- `github.close_issue` - Close issue (STEP_UP)
- `github.delete_branch` - Delete branch (STEP_UP)

### Gmail, Slack, Notion
See main documentation for full action list.

## Example Conversations

### Read Operations (AUTO - instant)
```
User> show me my GitHub repositories
🤖 Agent: You have 15 repositories...

User> what issues are open in AgentGuardian?
🤖 Agent: There are 3 open issues...
```

### Write Operations (NUDGE - requires approval)
```
User> create an issue titled "Fix bug" in my-repo
📦 Payload: {"repo":"my-repo","title":"Fix bug"}
⏸️  Action requires Human Approval. (Tier: NUDGE)
   Waiting for user to approve via Dashboard...
✅ Action was approved and executed.
🤖 Agent: I've created issue #42 in my-repo!
```

### Destructive Operations (STEP_UP - requires MFA)
```
User> merge PR #42 in my-repo
📦 Payload: {"repo":"my-repo","prNumber":42}
⏸️  Action requires Human Approval. (Tier: STEP_UP)
   Waiting for user to approve via Dashboard...
✅ Action was approved and executed.
🤖 Agent: PR #42 has been merged successfully!
```

## Repository Context

The agent automatically detects your local git repository:

```bash
# If you run the agent from /path/to/my-project
cd /path/to/my-project
npm run dev -w /path/to/AgentGuardian/agent

# Agent detects:
📂 Active Repository: my-project
   Remote origin: username/my-project
   ⚠️  Agent will act on YOUR repositories unless you specify an owner
```

You can then say:
- "create an issue in **this repo**" → uses `my-project`
- "create an issue in **other-repo**" → uses `other-repo`
- "create an issue in **facebook/react**" → uses `facebook/react` with owner

## Troubleshooting

### Terminal Flickering
- Use `npm run dev` (not `npm run dev:watch`)
- Watch mode is only for development

### "Could not resolve acting user"
- Log into dashboard first at http://localhost:5173
- This creates your user profile

### "Agent token fetch failed"
- Check Auth0 credentials in `.env`
- Verify M2M application is configured correctly

### Agent uses wrong repository
- Specify the repo name explicitly: "create issue in my-repo"
- Or use owner/repo format: "create issue in username/my-repo"

### Actions not executing
- Check that API is running: `npm run dev` (from project root)
- Check dashboard for pending approvals: http://localhost:5173

## Development

### Modifying the Agent

1. Edit files in `src/`
2. Use `npm run dev:watch` for auto-reload (terminal may flicker)
3. Or restart manually with `npm run dev`

### Adding New Actions

1. Add action to `src/llm/tools.ts`
2. Update system prompt in `src/index.ts`
3. Implement executor in API: `apps/api/src/services/executors/`

### Debugging

```bash
# Enable verbose logging
DEBUG=* npm run dev -w agent

# Check API logs
# Terminal running `npm run dev` shows API logs
```

## Architecture

```
Agent CLI (this)
  ↓ M2M Token
GET /api/v1/agent/whoami
  ↓ Returns user info
LLM (OpenRouter)
  ↓ Tool calls
POST /api/v1/agent/action
  ↓ Tier classification
  ↓ AUTO → Execute immediately
  ↓ NUDGE → Wait for approval
  ↓ STEP_UP → Wait for MFA
Poll GET /api/v1/agent/action/:jobId/status
  ↓ Approved
Execute action via Token Vault
  ↓ Return result
Display to user
```

## Security

- ✅ No service tokens stored locally
- ✅ All tokens managed by Auth0 Token Vault
- ✅ M2M authentication with scoped access
- ✅ Human-in-the-loop for sensitive actions
- ✅ MFA required for destructive operations
- ✅ Complete audit trail

## License

MIT
