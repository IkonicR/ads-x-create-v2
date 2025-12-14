-- Fix: Allow users to insert their own notifications (required for client-side triggers)
create policy "Users can insert their own notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);
