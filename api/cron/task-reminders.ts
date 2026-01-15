/**
 * Task Reminders Cron Job
 * 
 * GET /api/cron/task-reminders
 * 
 * Runs daily to check for tasks with due dates and send reminders.
 * Should be triggered by Vercel Cron or external scheduler.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
);

// Helper to format date for comparison
function formatDateForCompare(date: Date): string {
    return date.toISOString().split('T')[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Verify cron secret (basic security)
    const cronSecret = req.headers['x-cron-secret'];
    if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[task-reminders] Starting cron job...');

    try {
        const now = new Date();
        const today = formatDateForCompare(now);

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = formatDateForCompare(tomorrow);

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = formatDateForCompare(yesterday);

        // Fetch all tasks with:
        // 1. Due date is tomorrow, today, or yesterday (overdue)
        // 2. Has an assignee with email notifications enabled
        // 3. Status is NOT 'Done'
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('*')
            .neq('status', 'Done')
            .eq('notify_email', true)
            .not('assignee_id', 'is', null)
            .not('due_date', 'is', null);

        if (error) {
            console.error('[task-reminders] Error fetching tasks:', error);
            return res.status(500).json({ error: 'Failed to fetch tasks' });
        }

        if (!tasks || tasks.length === 0) {
            console.log('[task-reminders] No tasks with reminders enabled');
            return res.status(200).json({ message: 'No tasks to process', processed: 0 });
        }

        console.log(`[task-reminders] Found ${tasks.length} tasks with email notifications`);

        // Get unique assignee IDs
        const assigneeIds = [...new Set(tasks.map(t => t.assignee_id))];

        // Fetch profiles for assignees
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', assigneeIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        // Get business names
        const businessIds = [...new Set(tasks.filter(t => t.business_id).map(t => t.business_id))];
        let businessMap = new Map<string, string>();
        if (businessIds.length > 0) {
            const { data: businesses } = await supabase
                .from('businesses')
                .select('id, name')
                .in('id', businessIds);
            businessMap = new Map(businesses?.map(b => [b.id, b.name]) || []);
        }

        let processed = 0;
        let errors = 0;

        for (const task of tasks) {
            const dueDate = formatDateForCompare(new Date(task.due_date));
            let reminderType: 'tomorrow' | 'today' | 'overdue' | null = null;

            if (dueDate === tomorrowStr) {
                reminderType = 'tomorrow';
            } else if (dueDate === today) {
                reminderType = 'today';
            } else if (dueDate <= yesterdayStr) {
                reminderType = 'overdue';
            }

            if (!reminderType) continue;

            const profile = profileMap.get(task.assignee_id);
            if (!profile?.email) continue;

            console.log(`[task-reminders] Sending ${reminderType} reminder for task: ${task.title}`);

            // Call the notify endpoint
            try {
                const notifyResponse = await fetch(`${process.env.VITE_SUPABASE_URL?.replace('supabase.co', 'vercel.app') || 'https://ads-x-create-v2.vercel.app'}/api/tasks/notify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'reminder',
                        taskId: task.id,
                        taskTitle: task.title,
                        dueDate: task.due_date,
                        businessName: task.business_id ? businessMap.get(task.business_id) : undefined,
                        assigneeId: task.assignee_id,
                        assigneeName: profile.full_name,
                        assigneeEmail: profile.email,
                        reminderType,
                        notifyInApp: task.notify_in_app !== false,
                        notifyEmail: task.notify_email === true
                    })
                });

                if (notifyResponse.ok) {
                    processed++;
                } else {
                    errors++;
                    console.error(`[task-reminders] Failed to notify for task ${task.id}`);
                }
            } catch (err) {
                errors++;
                console.error(`[task-reminders] Error sending notification:`, err);
            }
        }

        console.log(`[task-reminders] Completed. Processed: ${processed}, Errors: ${errors}`);
        return res.status(200).json({
            message: 'Cron job completed',
            processed,
            errors
        });

    } catch (error) {
        console.error('[task-reminders] Cron job failed:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
