-- Add department_id to conversations table to support department-based group chats
alter table public.conversations add column if not exists department_id uuid references public.departments(id) on delete set null;

-- Update the conversations select policy to ensure members of a department can see their department channel
-- Note: The existing policy already allows users to select conversations if they are in conversation_members
-- So we don't strictly need to alter the policy as long as we insert the users into conversation_members!
