import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@agentguardian.com' },
    update: {},
    create: {
      auth0UserId: 'auth0|demo-user-001',
      email: 'demo@agentguardian.com',
      displayName: 'Demo User',
      avatarUrl: 'https://api.dicebear.com/8.x/avataaars/svg?seed=AgentGuardian',
    },
  });
  console.log(`  ✓ User: ${user.email} (${user.id})`);

  // Create service connections
  const services = ['GMAIL', 'GITHUB', 'SLACK', 'NOTION'] as const;
  for (const service of services) {
    await prisma.serviceConnection.upsert({
      where: { userId_service: { userId: user.id, service } },
      update: { status: 'ACTIVE' },
      create: {
        userId: user.id,
        service,
        status: 'ACTIVE',
      },
    });
    console.log(`  ✓ Connected: ${service}`);
  }

  // Create some demo audit log entries
  const demoLogs = [
    { service: 'GMAIL', actionType: 'gmail.read_emails', tier: 'AUTO', status: 'EXECUTED', ago: 6 },
    { service: 'GMAIL', actionType: 'gmail.read_emails', tier: 'AUTO', status: 'EXECUTED', ago: 5 },
    { service: 'NOTION', actionType: 'notion.read_pages', tier: 'AUTO', status: 'EXECUTED', ago: 5 },
    { service: 'GITHUB', actionType: 'github.read_issues', tier: 'AUTO', status: 'EXECUTED', ago: 4 },
    { service: 'GITHUB', actionType: 'github.read_prs', tier: 'AUTO', status: 'EXECUTED', ago: 4 },
    { service: 'SLACK', actionType: 'slack.post_to_channel', tier: 'NUDGE', status: 'APPROVED', ago: 3 },
    { service: 'GMAIL', actionType: 'gmail.send_email', tier: 'NUDGE', status: 'APPROVED', ago: 2 },
    { service: 'GMAIL', actionType: 'gmail.send_email', tier: 'NUDGE', status: 'DENIED', ago: 2 },
    { service: 'GITHUB', actionType: 'github.open_pr', tier: 'NUDGE', status: 'APPROVED', ago: 1 },
    { service: 'GITHUB', actionType: 'github.merge_to_main', tier: 'STEP_UP', status: 'STEP_UP_VERIFIED', ago: 1 },
    { service: 'GMAIL', actionType: 'gmail.delete_email', tier: 'STEP_UP', status: 'STEP_UP_VERIFIED', ago: 0.5 },
    { service: 'NOTION', actionType: 'notion.create_page', tier: 'NUDGE', status: 'EXECUTED', ago: 0.3 },
    { service: 'GITHUB', actionType: 'github.read_code', tier: 'AUTO', status: 'EXECUTED', ago: 0.2 },
    { service: 'SLACK', actionType: 'slack.read_channels', tier: 'AUTO', status: 'EXECUTED', ago: 0.1 },
    { service: 'GMAIL', actionType: 'gmail.search_emails', tier: 'AUTO', status: 'EXECUTED', ago: 0.05 },
  ];

  for (const log of demoLogs) {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        agentId: 'demo-agent',
        service: log.service as any,
        actionType: log.actionType,
        tier: log.tier as any,
        status: log.status as any,
        stepUpVerified: log.tier === 'STEP_UP',
        approvedByUserId: ['APPROVED', 'STEP_UP_VERIFIED'].includes(log.status)
          ? user.auth0UserId
          : undefined,
        executedAt: new Date(Date.now() - log.ago * 60 * 60 * 1000),
      },
    });
  }
  console.log(`  ✓ Created ${demoLogs.length} audit log entries`);

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
