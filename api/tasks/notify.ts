/**
 * Task Notification API Endpoint
 * 
 * POST /api/tasks/notify
 * 
 * Sends notifications (in-app and/or email) when a task is assigned or reminder is due.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateTaskAssignmentEmailHtml, generateTaskReminderEmailHtml } from './taskEmailTemplates';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY! // Use service role for inserting notifications
);

const resend = new Resend(process.env.RESEND_API_KEY);

interface NotifyTaskRequest {
    type: 'assignment' | 'reminder';
    taskId: string;
    taskTitle: string;
    taskDescription?: string;
    dueDate?: string;
    businessName?: string;
    // For assignment
    assigneeId?: string;
    assigneeName?: string;
    assigneeEmail?: string;
    assignerName?: string;
    // For reminder
    reminderType?: 'tomorrow' | 'today' | 'overdue';
    // Notification preferences
    notifyInApp?: boolean;
    notifyEmail?: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = req.body as NotifyTaskRequest;
        const {
            type,
            taskId,
            taskTitle,
            taskDescription,
            dueDate,
            businessName,
            assigneeId,
            assigneeName,
            assigneeEmail,
            assignerName,
            reminderType,
            notifyInApp = true,
            notifyEmail = false
        } = body;

        const taskLink = `https://app.xcreate.io/tasks?open=${taskId}`;

        // In-App Notification
        if (notifyInApp && assigneeId) {
            const notificationData = type === 'assignment'
                ? {
                    user_id: assigneeId,
                    type: 'task',
                    title: 'Task Assigned',
                    message: `${assignerName || 'Someone'} assigned you: "${taskTitle}"`,
                    action_url: `/tasks?open=${taskId}`,
                    is_read: false
                }
                : {
                    user_id: assigneeId,
                    type: 'reminder',
                    title: reminderType === 'overdue' ? '⚠️ Task Overdue' : 'Task Reminder',
                    message: `"${taskTitle}" is ${reminderType === 'tomorrow' ? 'due tomorrow' : reminderType === 'today' ? 'due today' : 'overdue'}`,
                    action_url: `/tasks?open=${taskId}`,
                    is_read: false
                };

            await supabase.from('notifications').insert(notificationData);
            console.log('[notify-task] In-app notification created for user:', assigneeId);
        }

        // Email Notification
        if (notifyEmail && assigneeEmail) {
            let emailHtml: string;
            let subject: string;

            if (type === 'assignment') {
                subject = `Task Assigned: ${taskTitle}`;
                emailHtml = generateTaskAssignmentEmailHtml({
                    assigneeName: assigneeName || 'there',
                    assignerName: assignerName || 'A team member',
                    taskTitle,
                    taskDescription,
                    dueDate,
                    businessName,
                    taskLink
                });
            } else {
                const subjectPrefix = reminderType === 'overdue' ? '⚠️ Overdue: ' : reminderType === 'today' ? 'Due Today: ' : 'Reminder: ';
                subject = `${subjectPrefix}${taskTitle}`;
                emailHtml = generateTaskReminderEmailHtml({
                    userName: assigneeName || 'there',
                    taskTitle,
                    dueDate: dueDate || new Date().toISOString(),
                    reminderType: reminderType || 'today',
                    businessName,
                    taskLink
                });
            }

            const { error: emailError } = await resend.emails.send({
                from: 'Ads x Create <noreply@xcreate.io>',
                to: assigneeEmail,
                subject,
                html: emailHtml
            });

            if (emailError) {
                console.error('[notify-task] Email send failed:', emailError);
                // Don't fail the request, just log the error
            } else {
                console.log('[notify-task] Email sent to:', assigneeEmail);
            }
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('[notify-task] Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
