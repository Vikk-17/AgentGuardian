# Agent Guardian 🛡️

A Trust Layer for AI Agents Acting on Your Behalf.

**Agent Guardian** gives users fine-grained, real-time control over AI agent behavior across multiple services. It introduces a three-tier action classification system — **Auto**, **Nudge**, and **Step-Up** — that maps naturally to the sensitivity and reversibility of each action.

## Features

- 🟢 **Auto Tier** — Safe, read-only actions execute silently via Token Vault
- 🟡 **Nudge Tier** — Sensitive actions require explicit approval (60s veto window)
- 🔴 **Step-Up Tier** — High-risk actions require MFA verification
- 🔐 **Auth0 Token Vault** — All OAuth tokens managed exclusively by Auth0
- 📊 **Real-time Dashboard** — Live activity feed with approve/deny controls
- 📜 **Immutable Audit Log** — Every action, every decision, every timestamp
- ⚡ **One-Click Revoke** — Instantly cut agent access to any service

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Zustand, TanStack Query
- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Real-time**: Socket.io, BullMQ, Redis
- **Auth**: Auth0 (Token Vault, Step-Up Auth, PKCE)
- **Services**: Gmail, GitHub, Slack, Notion

## Quick Start

```bash
# Clone and install
git clone https://github.com/subhachakraborty/AgentGuardian.git && cd AgentGuardian
npm install

# Start infrastructure
docker-compose up -d

# Configure environment
cp .env.example apps/api/.env
cp .env.example apps/web/.env
cp agent/.env.example agent/.env
# Edit .env files — you need an Auth0 tenant with Token Vault connections for:
# Gmail, GitHub, Slack, Notion (see docs: https://auth0.com/docs/token-vault)

# Run database migrations
npm run db:migrate

# Seed demo data
npm run db:seed

# Start development servers (API + Web Dashboard)
npm run dev
```

Visit http://localhost:5173 to see the Auth0 login screen.

### Running the Agent CLI

```bash
# First: Log into the dashboard to create your user profile
# Visit http://localhost:5173 and sign in with Auth0

# Then: Start the agent in a new terminal
npm run dev -w agent

# The agent automatically acts on behalf of the logged-in user!
# No hardcoded user IDs needed ✨
```

See [docs/auth0-m2m-action-setup.md](docs/auth0-m2m-action-setup.md) for production setup.

## Architecture

```
User Browser → React Dashboard ←→ Auth0 (Login/Session)
                    ↕ HTTPS + JWT
Express API Server (Node.js/TS)
  → Auth MW (JWT verify)
  → Tier Classifier (config lookup)
  → Action Executor (calls services via Token Vault)
                    ↕
Data Layer: PostgreSQL (Prisma) | Redis (BullMQ) | Auth0 Token Vault
                    ↕
External Services: Gmail API | GitHub API | Slack API | Notion API
```

## Hackathon

Built for **Authorized to Act: Auth0 for AI Agents** hackathon (April 2026).

Token Vault is load-bearing — all 4 service tokens managed exclusively via Auth0 Token Vault.

## License

MIT
