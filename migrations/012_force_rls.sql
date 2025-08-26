begin;
alter table if exists journal_entries force row level security;
alter table if exists mood_entries    force row level security;
commit;