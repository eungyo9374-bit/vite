-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 Run 하세요.
-- "내 보관함" 기능에 쓰는 favorites 테이블과 보안 규칙(RLS)입니다.

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

-- 로그인한 사용자가 "자기 행만" 읽고/쓰고/지울 수 있게 합니다.
alter table public.favorites enable row level security;

create policy "favorites_select_own" on public.favorites
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "favorites_insert_own" on public.favorites
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "favorites_delete_own" on public.favorites
  for delete to authenticated using ((select auth.uid()) = user_id);
