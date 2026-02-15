-- Function to get top readers (users)
create or replace function get_top_readers(limit_count int default 50)
returns table (
  id uuid,
  username text,
  avatar_url text,
  level int,
  xp int,
  rank_tier text,
  chapters_read bigint
) language plpgsql security definer as $$
begin
  return query
  select 
    p.id,
    p.username,
    p.avatar_url,
    p.level,
    p.xp,
    p.rank_tier::text,
    (
      select count(*) 
      from library_entries le 
      where le.user_id = p.id and (le.status = 'COMPLETED' or le.status = 'READING')
    ) as chapters_read -- Approximation using library entries count for now
  from profiles p
  order by p.level desc, p.xp desc
  limit limit_count;
end;
$$;

-- Function to get top guilds
create or replace function get_top_guilds(limit_count int default 50)
returns table (
  id uuid,
  name text,
  description text,
  level int,
  members_count bigint,
  created_at timestamptz
) language plpgsql security definer as $$
begin
  return query
  select 
    g.id,
    g.name,
    g.description,
    g.level,
    count(gm.user_id) as members_count,
    g.created_at
  from guilds g
  left join guild_members gm on g.id = gm.guild_id
  group by g.id
  order by g.level desc, members_count desc
  limit limit_count;
end;
$$;
