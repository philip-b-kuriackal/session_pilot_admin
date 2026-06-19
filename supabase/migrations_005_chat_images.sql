-- Migration 005 - Add image_url to chat messages

alter table public.messages 
add column if not exists image_url text;

-- Create the bucket for chat images
insert into storage.buckets (id, name, public) 
values ('chat_attachments', 'chat_attachments', true)
on conflict (id) do nothing;

-- Allow public read access to the images
create policy "chat_attachments_public_read" 
on storage.objects for select 
using (bucket_id = 'chat_attachments');

-- Allow authenticated users to upload images
create policy "chat_attachments_auth_insert" 
on storage.objects for insert 
to authenticated 
with check (bucket_id = 'chat_attachments');
