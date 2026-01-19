/**
 * Task Email Templates
 * 
 * Templates for task assignment and reminder emails.
 * Design matches the existing team invite email style.
 */

import { EmailTheme } from './theme';

interface TaskAssignmentEmailProps {
    assigneeName: string;
    assignerName: string;
    taskTitle: string;
    taskDescription?: string;
    dueDate?: string;
    businessName?: string;
    taskLink: string;
}

export function generateTaskAssignmentEmailHtml({
    assigneeName,
    assignerName,
    taskTitle,
    taskDescription,
    dueDate,
    businessName,
    taskLink
}: TaskAssignmentEmailProps): string {
    const previewText = `${assignerName} assigned you a task: ${taskTitle}`;

    const dueDateHtml = dueDate ? `
        <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
            <span style="font-size: 14px; color: ${EmailTheme.colors.subtext}; min-width: 80px;">Due</span>
            <span style="font-size: 14px; font-weight: 600; color: ${EmailTheme.colors.text};">${new Date(dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
    ` : '';

    const businessHtml = businessName ? `
        <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
            <span style="font-size: 14px; color: ${EmailTheme.colors.subtext}; min-width: 80px;">Business</span>
            <span style="font-size: 14px; font-weight: 600; color: ${EmailTheme.colors.text};">${businessName}</span>
        </div>
    ` : '';

    const descriptionHtml = taskDescription ? `
        <div style="padding: 12px 0;">
            <span style="font-size: 14px; color: ${EmailTheme.colors.subtext}; display: block; margin-bottom: 8px;">Description</span>
            <p style="font-size: 14px; color: ${EmailTheme.colors.text}; margin: 0; line-height: 1.5;">${taskDescription.substring(0, 200)}${taskDescription.length > 200 ? '...' : ''}</p>
        </div>
    ` : '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${previewText}</title>
</head>
<body style="background-color: ${EmailTheme.colors.background}; font-family: ${EmailTheme.structure.fontFamily}; margin: 0; padding: 40px 20px;">
    <!-- Preview text (hidden) -->
    <div style="display: none; max-height: 0px; overflow: hidden;">
        ${previewText}
    </div>
    
    <div style="background-color: ${EmailTheme.colors.surface}; border-radius: ${EmailTheme.structure.borderRadius}; padding: 40px; max-width: ${EmailTheme.structure.maxWidth}; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid ${EmailTheme.colors.border}; margin: 0 auto;">
        
        <!-- Logo Area -->
        <div style="margin-bottom: 32px; text-align: center;">
            <p style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; color: ${EmailTheme.colors.text};">
                Ads <span style="color: ${EmailTheme.colors.brand};">x</span> Create
            </p>
        </div>

        <!-- Header Badge -->
        <div style="text-align: center; margin-bottom: 32px;">
            <span style="display: inline-block; padding: 8px 16px; background-color: #F3F4F6; border-radius: 20px; font-size: 12px; font-weight: 700; color: ${EmailTheme.colors.brand}; text-transform: uppercase; letter-spacing: 1px;">
                Task Assigned
            </span>
        </div>

        <!-- Main Heading -->
        <h1 style="font-size: 28px; font-weight: 800; color: ${EmailTheme.colors.text}; margin: 0 0 16px 0; text-align: center; letter-spacing: -1px; line-height: 1.2;">
            You've been assigned<br>
            <span style="color: ${EmailTheme.colors.brand};">a new task</span>
        </h1>

        <p style="font-size: 16px; line-height: 1.6; color: ${EmailTheme.colors.subtext}; margin: 0 0 32px 0; text-align: center; max-width: 480px; margin-left: auto; margin-right: auto;">
            <strong>${assignerName}</strong> has assigned you the following task.
        </p>

        <!-- Task Details Card -->
        <div style="background-color: #F9FAFB; border-radius: 16px; padding: 24px; border: 1px solid #E5E7EB; margin-bottom: 32px; width: 100%; box-sizing: border-box;">
            <h2 style="font-size: 18px; font-weight: 700; color: ${EmailTheme.colors.text}; margin: 0 0 16px 0;">${taskTitle}</h2>
            ${dueDateHtml}
            ${businessHtml}
            ${descriptionHtml}
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 0 0 32px 0;">
            <a href="${taskLink}" style="display: inline-block; background: ${EmailTheme.colors.text}; color: #FFFFFF; padding: 16px 48px; border-radius: 14px; font-size: 16px; font-weight: 600; text-decoration: none; box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.3);">
                View Task
            </a>
        </div>

        <hr style="border: none; border-top: 1px solid ${EmailTheme.colors.border}; margin: 32px 0;">

        <p style="font-size: 12px; line-height: 1.5; color: #9CA3AF; text-align: center; margin: 0;">
            You received this email because you were assigned a task in Ads x Create.<br>
            <a href="https://app.xcreate.io" style="color: ${EmailTheme.colors.subtext}; text-decoration: underline;">Privacy Policy</a> • <a href="https://app.xcreate.io" style="color: ${EmailTheme.colors.subtext}; text-decoration: underline;">Support</a>
        </p>

        <!-- Footer -->
        <div style="margin-top: 40px; border-top: 1px solid ${EmailTheme.colors.border}; padding-top: 24px;">
            <p style="font-size: 12px; color: ${EmailTheme.colors.subtext}; text-align: center; margin: 0;">
                Powered by <a href="https://app.xcreate.io" style="color: ${EmailTheme.colors.brand};">Ads x Create</a>
            </p>
        </div>

    </div>
</body>
</html>`;
}

/**
 * Task Reminder Email Template
 * 
 * Sent as due date reminder (tomorrow, today, overdue).
 */
interface TaskReminderEmailProps {
    userName: string;
    taskTitle: string;
    dueDate: string;
    reminderType: 'tomorrow' | 'today' | 'overdue';
    businessName?: string;
    taskLink: string;
}

export function generateTaskReminderEmailHtml({
    userName,
    taskTitle,
    dueDate,
    reminderType,
    businessName,
    taskLink
}: TaskReminderEmailProps): string {
    const headings = {
        tomorrow: { badge: 'Reminder', title: 'due tomorrow', color: EmailTheme.colors.brand },
        today: { badge: 'Due Today', title: 'due today', color: '#F59E0B' },
        overdue: { badge: 'Overdue', title: 'is overdue', color: '#EF4444' }
    };

    const { badge, title, color } = headings[reminderType];
    const previewText = `Task reminder: "${taskTitle}" is ${title}`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${previewText}</title>
</head>
<body style="background-color: ${EmailTheme.colors.background}; font-family: ${EmailTheme.structure.fontFamily}; margin: 0; padding: 40px 20px;">
    <!-- Preview text (hidden) -->
    <div style="display: none; max-height: 0px; overflow: hidden;">
        ${previewText}
    </div>
    
    <div style="background-color: ${EmailTheme.colors.surface}; border-radius: ${EmailTheme.structure.borderRadius}; padding: 40px; max-width: ${EmailTheme.structure.maxWidth}; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid ${EmailTheme.colors.border}; margin: 0 auto;">
        
        <!-- Logo Area -->
        <div style="margin-bottom: 32px; text-align: center;">
            <p style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; color: ${EmailTheme.colors.text};">
                Ads <span style="color: ${EmailTheme.colors.brand};">x</span> Create
            </p>
        </div>

        <!-- Header Badge -->
        <div style="text-align: center; margin-bottom: 32px;">
            <span style="display: inline-block; padding: 8px 16px; background-color: #F3F4F6; border-radius: 20px; font-size: 12px; font-weight: 700; color: ${color}; text-transform: uppercase; letter-spacing: 1px;">
                ${badge}
            </span>
        </div>

        <!-- Main Heading -->
        <h1 style="font-size: 28px; font-weight: 800; color: ${EmailTheme.colors.text}; margin: 0 0 16px 0; text-align: center; letter-spacing: -1px; line-height: 1.2;">
            Your task<br>
            <span style="color: ${color};">${title}</span>
        </h1>

        <p style="font-size: 16px; line-height: 1.6; color: ${EmailTheme.colors.subtext}; margin: 0 0 32px 0; text-align: center; max-width: 480px; margin-left: auto; margin-right: auto;">
            Hi ${userName}, here's a reminder about your upcoming task.
        </p>

        <!-- Task Details Card -->
        <div style="background-color: #F9FAFB; border-radius: 16px; padding: 24px; border: 1px solid #E5E7EB; margin-bottom: 32px; width: 100%; box-sizing: border-box;">
            <h2 style="font-size: 18px; font-weight: 700; color: ${EmailTheme.colors.text}; margin: 0 0 16px 0;">${taskTitle}</h2>
            <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                <span style="font-size: 14px; color: ${EmailTheme.colors.subtext}; min-width: 80px;">Due</span>
                <span style="font-size: 14px; font-weight: 600; color: ${color};">${new Date(dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
            ${businessName ? `
            <div style="display: flex; align-items: center; padding: 12px 0;">
                <span style="font-size: 14px; color: ${EmailTheme.colors.subtext}; min-width: 80px;">Business</span>
                <span style="font-size: 14px; font-weight: 600; color: ${EmailTheme.colors.text};">${businessName}</span>
            </div>
            ` : ''}
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 0 0 32px 0;">
            <a href="${taskLink}" style="display: inline-block; background: ${EmailTheme.colors.text}; color: #FFFFFF; padding: 16px 48px; border-radius: 14px; font-size: 16px; font-weight: 600; text-decoration: none; box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.3);">
                View Task
            </a>
        </div>

        <hr style="border: none; border-top: 1px solid ${EmailTheme.colors.border}; margin: 32px 0;">

        <p style="font-size: 12px; line-height: 1.5; color: #9CA3AF; text-align: center; margin: 0;">
            You received this email because you have a task with email reminders enabled.<br>
            <a href="https://app.xcreate.io" style="color: ${EmailTheme.colors.subtext}; text-decoration: underline;">Manage Preferences</a> • <a href="https://app.xcreate.io" style="color: ${EmailTheme.colors.subtext}; text-decoration: underline;">Support</a>
        </p>

        <!-- Footer -->
        <div style="margin-top: 40px; border-top: 1px solid ${EmailTheme.colors.border}; padding-top: 24px;">
            <p style="font-size: 12px; color: ${EmailTheme.colors.subtext}; text-align: center; margin: 0;">
                Powered by <a href="https://app.xcreate.io" style="color: ${EmailTheme.colors.brand};">Ads x Create</a>
            </p>
        </div>

    </div>
</body>
</html>`;
}
