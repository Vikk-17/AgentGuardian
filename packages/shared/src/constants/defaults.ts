import { ActionTier, ServiceType } from '../types/actions';

export const ACTION_DESCRIPTIONS: Record<string, string> = {
  // Gmail
  'gmail.read_emails': 'List and read unread/recent emails',
  'gmail.search_emails': 'Search emails by query',
  'gmail.read_attachments': 'Download email attachments',
  'gmail.send_email': 'Compose and send a new email',
  'gmail.reply_email': 'Reply to an existing email',
  'gmail.send_to_external': 'Send email to non-organization address',
  'gmail.delete_email': 'Move email to trash',
  'gmail.send_bulk': 'Send batch of emails',

  // GitHub
  'github.read_repositories': 'List and read repositories',
  'github.read_issues': 'List and read issues',
  'github.read_prs': 'List and read pull requests',
  'github.read_code': 'Read file contents from repository',
  'github.read_branches': 'List repository branches',
  'github.create_issue': 'Open a new GitHub issue',
  'github.comment_issue': 'Add comment to an issue or PR',
  'github.open_pr': 'Create a new pull request',
  'github.merge_pr': 'Merge a pull request to any branch',
  'github.merge_to_main': 'Merge pull request to main/master',
  'github.push_code': 'Push commits to a branch',
  'github.delete_branch': 'Delete a branch',
  'github.close_issue': 'Close a GitHub issue',

  // Slack
  'slack.read_channels': 'List channels and read messages',
  'slack.read_dms': 'Read direct messages',
  'slack.post_to_channel': 'Post a message to a channel',
  'slack.send_dm': 'Send a direct message to a user',
  'slack.post_to_general': 'Post to #general or #all channel',
  'slack.create_channel': 'Create a new Slack channel',

  // Notion
  'notion.read_pages': 'Read Notion pages and databases',
  'notion.update_page': 'Edit content of an existing page',
  'notion.create_page': 'Create a new Notion page',
  'notion.delete_page': 'Delete or archive a page',
  'notion.share_page': 'Change sharing settings of a page',
};

export const DEFAULT_TIER_MAP: Record<string, Record<string, ActionTier>> = {
  [ServiceType.GMAIL]: {
    'gmail.read_emails': ActionTier.AUTO,
    'gmail.search_emails': ActionTier.AUTO,
    'gmail.read_attachments': ActionTier.NUDGE,
    'gmail.send_email': ActionTier.NUDGE,
    'gmail.reply_email': ActionTier.NUDGE,
    'gmail.send_to_external': ActionTier.STEP_UP,
    'gmail.delete_email': ActionTier.STEP_UP,
    'gmail.send_bulk': ActionTier.STEP_UP,
  },
  [ServiceType.GITHUB]: {
    'github.read_repositories': ActionTier.AUTO,
    'github.read_issues': ActionTier.AUTO,
    'github.read_prs': ActionTier.AUTO,
    'github.read_code': ActionTier.AUTO,
    'github.read_branches': ActionTier.AUTO,
    'github.create_issue': ActionTier.NUDGE,
    'github.comment_issue': ActionTier.NUDGE,
    'github.open_pr': ActionTier.NUDGE,
    'github.merge_pr': ActionTier.STEP_UP,
    'github.merge_to_main': ActionTier.STEP_UP,
    'github.push_code': ActionTier.STEP_UP,
    'github.delete_branch': ActionTier.STEP_UP,
    'github.close_issue': ActionTier.STEP_UP,
  },
  [ServiceType.SLACK]: {
    'slack.read_channels': ActionTier.AUTO,
    'slack.read_dms': ActionTier.NUDGE,
    'slack.post_to_channel': ActionTier.NUDGE,
    'slack.send_dm': ActionTier.NUDGE,
    'slack.post_to_general': ActionTier.STEP_UP,
    'slack.create_channel': ActionTier.STEP_UP,
  },
  [ServiceType.NOTION]: {
    'notion.read_pages': ActionTier.AUTO,
    'notion.update_page': ActionTier.NUDGE,
    'notion.create_page': ActionTier.NUDGE,
    'notion.delete_page': ActionTier.STEP_UP,
    'notion.share_page': ActionTier.STEP_UP,
  },
};

export const SERVICE_ACTIONS: Record<ServiceType, string[]> = {
  [ServiceType.GMAIL]: Object.keys(DEFAULT_TIER_MAP[ServiceType.GMAIL]),
  [ServiceType.GITHUB]: Object.keys(DEFAULT_TIER_MAP[ServiceType.GITHUB]),
  [ServiceType.SLACK]: Object.keys(DEFAULT_TIER_MAP[ServiceType.SLACK]),
  [ServiceType.NOTION]: Object.keys(DEFAULT_TIER_MAP[ServiceType.NOTION]),
};

export const NUDGE_TIMEOUT_MS = 60_000; // 60 seconds
