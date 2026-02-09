-- Create mt-screenshots storage bucket for MT trade screenshots
insert into storage.buckets (id, name, owner, public)
values ('mt-screenshots', 'mt-screenshots', null, true)
on conflict (id) do nothing;

-- Set RLS policy for mt-screenshots bucket
create policy "Users can upload their own MT screenshots"
on storage.objects for insert
with check (
  bucket_id = 'mt-screenshots' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can read their own MT screenshots"
on storage.objects for select
with check (
  bucket_id = 'mt-screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own MT screenshots"
on storage.objects for delete
with check (
  bucket_id = 'mt-screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
);
