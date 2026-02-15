-- Scraper Sources (e.g., ReManga, MangaLib)
create table if not exists scraper_sources (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  url text not null,
  icon_url text,
  status text default 'active', -- active, inactive, error
  frequency_minutes int default 60, -- how often to check
  last_sync timestamptz,
  success_rate int default 100,
  config jsonb default '{}'::jsonb, -- specialized config for the scraper
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Scraper Jobs (Individual scraping tasks)
create table if not exists scraper_jobs (
  id uuid default gen_random_uuid() primary key,
  source_id uuid references scraper_sources(id) on delete set null,
  manga_title text,
  manga_url text, -- The specific URL being scraped
  type text not null, -- 'full_sync', 'single_chapter', 'metadata'
  status text default 'pending', -- pending, processing, completed, failed
  progress int default 0,
  result_summary text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Scraper Logs (Activity feed)
create table if not exists scraper_logs (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references scraper_jobs(id) on delete set null,
  source_id uuid references scraper_sources(id) on delete set null,
  level text default 'info', -- info, warn, error, success
  message text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table scraper_sources enable row level security;
alter table scraper_jobs enable row level security;
alter table scraper_logs enable row level security;

-- Policies (Admin only)
create policy "Admin can view scraper sources" on scraper_sources for select using (auth.role() = 'service_role' or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admin can manage scraper sources" on scraper_sources for all using (auth.role() = 'service_role' or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admin can view scraper jobs" on scraper_jobs for select using (auth.role() = 'service_role' or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admin can manage scraper jobs" on scraper_jobs for all using (auth.role() = 'service_role' or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admin can view scraper logs" on scraper_logs for select using (auth.role() = 'service_role' or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admin can manage scraper logs" on scraper_logs for all using (auth.role() = 'service_role' or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Mock Data for UI
insert into scraper_sources (name, url, status, frequency_minutes, success_rate, last_sync) values
('ReManga', 'https://remanga.org', 'active', 30, 98, now() - interval '2 minutes'),
('MangaLib', 'https://mangalib.me', 'active', 60, 95, now() - interval '15 minutes'),
('Desu.me', 'https://desu.me', 'error', 45, 40, now() - interval '2 hours'),
('Asura Scans', 'https://asurascans.com', 'warning', 60, 75, now() - interval '30 minutes');

insert into scraper_jobs (manga_title, type, status, progress, created_at) values
('Parsing ReManga', 'full_sync', 'processing', 45, now()),
('Auto-update MangaLib', 'metadata', 'processing', 82, now()),
('Full Sync: Desu.me', 'full_sync', 'pending', 0, now());

insert into scraper_logs (level, message, created_at) values 
('success', 'Backup process completed successfully. Size: 4.2GB', now() - interval '1 minute'),
('info', 'User #8821 logged in from IP 192.168.x.x', now() - interval '5 minutes'),
('error', 'Payment Gateway Timeout - Transaction #TX-9921 retrying...', now() - interval '10 minutes'),
('warn', 'High latency detected on Image Server 03 (140ms)', now() - interval '15 minutes'),
('info', 'Cron job "UpdateViewCounts" started.', now() - interval '20 minutes');
