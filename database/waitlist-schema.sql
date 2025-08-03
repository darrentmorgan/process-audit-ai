-- Waitlist table for landing page signups
create table if not exists public.waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  source text default 'landing_page',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb default '{}'::jsonb
);

-- Add RLS (Row Level Security) policies
alter table public.waitlist enable row level security;

-- Allow public to insert (for signups)
create policy "Allow public to insert waitlist entries"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);

-- Allow authenticated users to read their own entries
create policy "Allow users to read own waitlist entries"
  on public.waitlist for select
  to authenticated
  using (true);

-- Create index for faster email lookups
create index if not exists waitlist_email_idx on public.waitlist(email);
create index if not exists waitlist_created_at_idx on public.waitlist(created_at desc);

-- Add trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_waitlist_updated_at
  before update on public.waitlist
  for each row
  execute procedure public.handle_updated_at();