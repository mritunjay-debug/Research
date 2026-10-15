-- Research Scholar Workspace: initial Supabase schema
-- Apply in the Supabase SQL Editor or through a connected Supabase migration tool.
-- This file is a migration definition; committing it does not execute it in Supabase.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.research_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  research_question text not null default '',
  status text not null default 'active'
    check (status in ('active', 'on_hold', 'completed', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bibliography_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.research_projects(id) on delete cascade,
  title text not null default '',
  authors text[] not null default '{}',
  publication_year integer,
  journal text not null default '',
  doi text,
  url text,
  abstract text,
  keywords text[] not null default '{}',
  document_type text not null default '',
  source text not null default '',
  source_file text not null default '',
  open_access boolean,
  screening_decision text not null default 'pending'
    check (screening_decision in ('pending', 'include', 'exclude', 'maybe', 'duplicate')),
  screening_stage text not null default 'title_abstract'
    check (screening_stage in ('imported', 'deduplication', 'title_abstract', 'full_text', 'included', 'excluded')),
  exclusion_reason text not null default '',
  notes text not null default '',
  duplicate_of uuid references public.bibliography_records(id) on delete set null,
  duplicate_status text not null default '',
  source_id text not null default '',
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.screening_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bibliography_id uuid not null references public.bibliography_records(id) on delete cascade,
  stage text not null,
  decision text not null,
  rationale text not null default '',
  reviewer_note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.research_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.research_projects(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'done', 'cancelled')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.temporary_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.research_projects(id) on delete cascade,
  original_filename text not null,
  content_type text not null default 'application/octet-stream',
  byte_size bigint not null default 0 check (byte_size >= 0),
  storage_path text,
  processing_status text not null default 'pending'
    check (processing_status in ('pending', 'processing', 'completed', 'failed')),
  processing_result jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index if not exists research_projects_user_updated_idx
  on public.research_projects (user_id, updated_at desc);
create index if not exists bibliography_user_project_idx
  on public.bibliography_records (user_id, project_id, created_at desc);
create index if not exists bibliography_title_search_idx
  on public.bibliography_records using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(journal, '')));
create index if not exists bibliography_doi_idx
  on public.bibliography_records (user_id, lower(doi)) where doi is not null and trim(doi) <> '';
create index if not exists bibliography_stage_decision_idx
  on public.bibliography_records (user_id, project_id, screening_stage, screening_decision);
create index if not exists screening_history_record_idx
  on public.screening_history (user_id, bibliography_id, created_at desc);
create index if not exists research_tasks_project_status_idx
  on public.research_tasks (user_id, project_id, status, due_at);
create index if not exists temporary_uploads_expiry_idx
  on public.temporary_uploads (expires_at);

drop trigger if exists research_projects_set_updated_at on public.research_projects;
create trigger research_projects_set_updated_at before update on public.research_projects
for each row execute function public.set_updated_at();
drop trigger if exists bibliography_records_set_updated_at on public.bibliography_records;
create trigger bibliography_records_set_updated_at before update on public.bibliography_records
for each row execute function public.set_updated_at();
drop trigger if exists research_tasks_set_updated_at on public.research_tasks;
create trigger research_tasks_set_updated_at before update on public.research_tasks
for each row execute function public.set_updated_at();

alter table public.research_projects enable row level security;
alter table public.bibliography_records enable row level security;
alter table public.screening_history enable row level security;
alter table public.research_tasks enable row level security;
alter table public.temporary_uploads enable row level security;

drop policy if exists "users manage own research projects" on public.research_projects;
create policy "users manage own research projects" on public.research_projects
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users manage own bibliography" on public.bibliography_records;
create policy "users manage own bibliography" on public.bibliography_records
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users manage own screening history" on public.screening_history;
create policy "users manage own screening history" on public.screening_history
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users manage own research tasks" on public.research_tasks;
create policy "users manage own research tasks" on public.research_tasks
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users manage own temporary uploads" on public.temporary_uploads;
create policy "users manage own temporary uploads" on public.temporary_uploads
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.research_projects to authenticated;
grant select, insert, update, delete on public.bibliography_records to authenticated;
grant select, insert, update, delete on public.screening_history to authenticated;
grant select, insert, update, delete on public.research_tasks to authenticated;
grant select, insert, update, delete on public.temporary_uploads to authenticated;

-- Temporary rows are expired by timestamp, but physical deletion requires a scheduled
-- Supabase Cron job or an external scheduled task. Do not assume expiry_at deletes rows.
