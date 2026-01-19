/**
 * Email Templates - Barrel Export
 * 
 * Centralized exports for all email templates.
 * This pattern allows Vercel serverless to properly bundle shared utilities.
 */

// Shared theme
export { EmailTheme } from './theme';

// Team invite
export { generateInviteEmailHtml } from './invite';

// Asset sharing
export { generateShareAssetEmailHtml } from './share-asset';

// Task notifications
export { generateTaskAssignmentEmailHtml, generateTaskReminderEmailHtml } from './task';
