-- =====================================================
-- 우리동네 - Database Schema
-- Supabase에서 실행할 SQL
-- =====================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================================================
-- 1. Buildings (건물) 테이블
-- =====================================================
create table if not exists public.buildings (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  address text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Buildings 인덱스
create index if not exists buildings_name_idx on public.buildings(name);

-- =====================================================
-- 2. Profiles (사용자 프로필) 테이블
-- =====================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  nickname text not null,
  building_id uuid references public.buildings(id) on delete set null,
  floor text,
  verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles 인덱스
create index if not exists profiles_building_id_idx on public.profiles(building_id);
create index if not exists profiles_verified_idx on public.profiles(verified);

-- =====================================================
-- 3. Verification Requests (거주 인증 요청) 테이블
-- =====================================================
create table if not exists public.verification_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  building_id uuid references public.buildings(id) on delete cascade not null,
  floor text not null,
  document_url text not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reviewed_at timestamp with time zone
);

-- Verification Requests 인덱스
create index if not exists verification_requests_user_id_idx on public.verification_requests(user_id);
create index if not exists verification_requests_status_idx on public.verification_requests(status);

-- =====================================================
-- 4. Posts (게시글) 테이블
-- =====================================================
create table if not exists public.posts (
  id uuid default uuid_generate_v4() primary key,
  board_type text check (board_type in ('notice', 'share', 'free')) not null,
  title text not null,
  content text not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  building_id uuid references public.buildings(id) on delete cascade not null,
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Posts 인덱스
create index if not exists posts_board_type_idx on public.posts(board_type);
create index if not exists posts_building_id_idx on public.posts(building_id);
create index if not exists posts_author_id_idx on public.posts(author_id);
create index if not exists posts_created_at_idx on public.posts(created_at desc);

-- =====================================================
-- 5. Comments (댓글) 테이블
-- =====================================================
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Comments 인덱스
create index if not exists comments_post_id_idx on public.comments(post_id);
create index if not exists comments_author_id_idx on public.comments(author_id);
create index if not exists comments_created_at_idx on public.comments(created_at);

-- =====================================================
-- 6. Likes (좋아요) 테이블
-- =====================================================
create table if not exists public.likes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

-- Likes 인덱스
create index if not exists likes_post_id_idx on public.likes(post_id);
create index if not exists likes_user_id_idx on public.likes(user_id);

-- =====================================================
-- 7. Row Level Security (RLS) 정책
-- =====================================================

-- Enable RLS
alter table public.buildings enable row level security;
alter table public.profiles enable row level security;
alter table public.verification_requests enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;

-- Buildings RLS: 모두 읽기 가능
create policy "Buildings are viewable by everyone"
  on public.buildings for select
  using (true);

-- Profiles RLS: 본인 프로필은 모두 가능, 같은 건물 사용자는 읽기만
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can view profiles in same building"
  on public.profiles for select
  using (
    building_id in (
      select building_id from public.profiles where id = auth.uid()
    )
  );

-- Verification Requests RLS: 본인 요청만 보기/생성
create policy "Users can view own verification requests"
  on public.verification_requests for select
  using (auth.uid() = user_id);

create policy "Users can create verification requests"
  on public.verification_requests for insert
  with check (auth.uid() = user_id);

-- Posts RLS: 같은 건물 사용자만 접근
create policy "Users can view posts in same building"
  on public.posts for select
  using (
    building_id in (
      select building_id from public.profiles
      where id = auth.uid() and verified = true
    )
  );

create policy "Verified users can create posts"
  on public.posts for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and verified = true
    )
  );

create policy "Users can update own posts"
  on public.posts for update
  using (auth.uid() = author_id);

create policy "Users can delete own posts"
  on public.posts for delete
  using (auth.uid() = author_id);

-- Comments RLS: 같은 건물 게시글의 댓글만 접근
create policy "Users can view comments in same building"
  on public.comments for select
  using (
    post_id in (
      select id from public.posts
      where building_id in (
        select building_id from public.profiles
        where id = auth.uid() and verified = true
      )
    )
  );

create policy "Verified users can create comments"
  on public.comments for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and verified = true
    )
  );

create policy "Users can update own comments"
  on public.comments for update
  using (auth.uid() = author_id);

create policy "Users can delete own comments"
  on public.comments for delete
  using (auth.uid() = author_id);

-- Likes RLS: 같은 건물 게시글에만 좋아요
create policy "Users can view likes"
  on public.likes for select
  using (true);

create policy "Users can create likes"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own likes"
  on public.likes for delete
  using (auth.uid() = user_id);

-- =====================================================
-- 8. Functions & Triggers
-- =====================================================

-- Function: 게시글 작성 시 댓글/좋아요 카운트 업데이트
create or replace function public.handle_comment_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.posts
    set comments_count = comments_count + 1
    where id = NEW.post_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update public.posts
    set comments_count = comments_count - 1
    where id = OLD.post_id;
    return OLD;
  end if;
end;
$$ language plpgsql security definer;

create or replace function public.handle_like_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.posts
    set likes_count = likes_count + 1
    where id = NEW.post_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update public.posts
    set likes_count = likes_count - 1
    where id = OLD.post_id;
    return OLD;
  end if;
end;
$$ language plpgsql security definer;

-- Triggers
drop trigger if exists on_comment_created on public.comments;
create trigger on_comment_created
  after insert on public.comments
  for each row execute procedure public.handle_comment_count();

drop trigger if exists on_comment_deleted on public.comments;
create trigger on_comment_deleted
  after delete on public.comments
  for each row execute procedure public.handle_comment_count();

drop trigger if exists on_like_created on public.likes;
create trigger on_like_created
  after insert on public.likes
  for each row execute procedure public.handle_like_count();

drop trigger if exists on_like_deleted on public.likes;
create trigger on_like_deleted
  after delete on public.likes
  for each row execute procedure public.handle_like_count();

-- Function: 새 사용자 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nickname)
  values (new.id, new.email, 'User' || substr(new.id::text, 1, 6));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: 회원가입 시 프로필 자동 생성
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================
-- 9. 초기 데이터 (테스트용)
-- =====================================================

-- 샘플 건물 데이터
insert into public.buildings (name, address) values
  ('강남타워 오피스텔', '서울시 강남구 테헤란로 123'),
  ('서초 레지던스', '서울시 서초구 서초대로 456')
on conflict do nothing;

-- =====================================================
-- 완료!
-- =====================================================
