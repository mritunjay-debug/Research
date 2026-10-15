-- Shared cloud persistence for utility records. User-owned records are protected by RLS.
create table if not exists public.research_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.research_projects(id) on delete set null,
  artifact_type text not null check (artifact_type in ('journal', 'reviewer_response', 'analysis_run')),
  local_id text not null check (length(trim(local_id)) > 0),
  title text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, artifact_type, local_id)
);
create index if not exists research_artifacts_user_type_updated_idx
  on public.research_artifacts (user_id, artifact_type, updated_at desc);
create index if not exists research_artifacts_project_idx
  on public.research_artifacts (user_id, project_id, artifact_type);
drop trigger if exists research_artifacts_set_updated_at on public.research_artifacts;
create trigger research_artifacts_set_updated_at before update on public.research_artifacts
for each row execute function public.set_updated_at();
alter table public.research_artifacts enable row level security;
drop policy if exists "users manage own research artifacts" on public.research_artifacts;
create policy "users manage own research artifacts" on public.research_artifacts
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.research_artifacts to authenticated;
