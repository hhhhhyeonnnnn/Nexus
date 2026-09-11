-- Migration: 20260911160000_storage_setup.sql
-- Configure Supabase Storage buckets and access policies:
-- 1. 'receipts': Financial accounting receipts, proof photos, and tax vouchers
-- 2. 'attachments': Meeting materials, event application attachments, and official documents

begin;

set search_path = '';

do $$
begin
  -- Only execute if Supabase storage schema exists
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    -- 1. Create or update storage buckets
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values
      (
        'receipts',
        'receipts',
        true,
        10485760, -- 10MB limit
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
      ),
      (
        'attachments',
        'attachments',
        true,
        52428800, -- 50MB limit
        null
      )
    on conflict (id) do update set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

    -- 2. Storage Objects RLS Policies
    -- Allow public read for receipts
    if not exists (
      select 1 from pg_policies
      where schemaname = 'storage' and tablename = 'objects' and policyname = 'receipts_public_read'
    ) then
      create policy receipts_public_read on storage.objects
        for select
        using (bucket_id = 'receipts');
    end if;

    -- Allow authenticated members to upload receipts
    if not exists (
      select 1 from pg_policies
      where schemaname = 'storage' and tablename = 'objects' and policyname = 'receipts_auth_insert'
    ) then
      create policy receipts_auth_insert on storage.objects
        for insert
        to authenticated
        with check (bucket_id = 'receipts');
    end if;

    -- Allow authenticated members to update their receipts
    if not exists (
      select 1 from pg_policies
      where schemaname = 'storage' and tablename = 'objects' and policyname = 'receipts_auth_update'
    ) then
      create policy receipts_auth_update on storage.objects
        for update
        to authenticated
        using (bucket_id = 'receipts');
    end if;

    -- Allow public read for attachments
    if not exists (
      select 1 from pg_policies
      where schemaname = 'storage' and tablename = 'objects' and policyname = 'attachments_public_read'
    ) then
      create policy attachments_public_read on storage.objects
        for select
        using (bucket_id = 'attachments');
    end if;

    -- Allow authenticated members to upload attachments
    if not exists (
      select 1 from pg_policies
      where schemaname = 'storage' and tablename = 'objects' and policyname = 'attachments_auth_insert'
    ) then
      create policy attachments_auth_insert on storage.objects
        for insert
        to authenticated
        with check (bucket_id = 'attachments');
    end if;

    -- Allow authenticated members to update attachments
    if not exists (
      select 1 from pg_policies
      where schemaname = 'storage' and tablename = 'objects' and policyname = 'attachments_auth_update'
    ) then
      create policy attachments_auth_update on storage.objects
        for update
        to authenticated
        using (bucket_id = 'attachments');
    end if;
  end if;
end $$;

commit;
