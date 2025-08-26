-- Enforce UID everywhere + RLS guardrails
begin;

-- Abort if any missing UID (safety net)
do $$
begin
  if exists (select 1 from journal_entries where uid is null)
     or exists (select 1 from mood_entries    where uid is null) then
    raise exception 'UID backfill incomplete; aborting lock-in';
  end if;
end$$;

-- Format checks (optional but recommended)
alter table journal_entries
  drop constraint if exists journal_entries_uid_fmt,
  add  constraint journal_entries_uid_fmt check (uid ~ '^usr_[0-9a-f]{32}$');

alter table mood_entries
  drop constraint if exists mood_entries_uid_fmt,
  add  constraint mood_entries_uid_fmt    check (uid ~ '^usr_[0-9a-f]{32}$');

-- Hard requirement: no null UIDs
alter table journal_entries alter column uid set not null;
alter table mood_entries    alter column uid set not null;

-- Row-Level Security: isolation by app.uid
alter table journal_entries enable row level security;
alter table mood_entries    enable row level security;

drop policy if exists journal_by_uid on journal_entries;
drop policy if exists mood_by_uid    on mood_entries;

create policy journal_by_uid on journal_entries
  using (uid = current_setting('app.uid', true));

create policy mood_by_uid on mood_entries
  using (uid = current_setting('app.uid', true));

commit;