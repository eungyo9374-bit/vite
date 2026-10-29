-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 Run 하세요. (여러 번 실행해도 안전합니다)
-- "내 보관함" 기능에 쓰는 favorites 테이블, API 접근 권한(GRANT), 보안 규칙(RLS)입니다.

create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pixabay_id  bigint not null,
  image_url   text   not null,
  large_url   text,
  tags        text,
  author      text,
  page_url    text,
  created_at  timestamptz not null default now(),
  unique (user_id, pixabay_id)
);

-- 새 프로젝트에서는 테이블을 SQL 로 만들면 API 권한이 자동으로 안 붙는 경우가 있어 명시합니다.
grant usage on schema public to authenticated;
grant select, insert, delete on public.favorites to authenticated;

-- 로그인한 사용자가 "자기 행만" 읽고/쓰고/지울 수 있게 합니다.
alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
drop policy if exists "favorites_insert_own" on public.favorites;
drop policy if exists "favorites_delete_own" on public.favorites;

create policy "favorites_select_own" on public.favorites
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "favorites_insert_own" on public.favorites
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "favorites_delete_own" on public.favorites
  for delete to authenticated using ((select auth.uid()) = user_id);

-- API 스키마 캐시 새로고침 (테이블을 방금 만들었는데 "schema cache" 오류가 날 때)
notify pgrst, 'reload schema';
