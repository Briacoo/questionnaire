-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (linked to auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pseudo text unique not null,
  role text not null default 'admin' check (role in ('admin', 'manager')),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Quizzes table
create table public.quizzes (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  settings jsonb not null default '{
    "time_limit": null,
    "passing_score": null,
    "show_feedback": false,
    "shuffle_questions": false,
    "shuffle_answers": false,
    "allow_back_navigation": true,
    "error_message": null,
    "entry_form_fields": [],
    "max_attempts": null
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Questions table
create table public.questions (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  type text not null check (type in (
    'mcq_single', 'mcq_multiple', 'true_false', 'free_text',
    'drag_order', 'matching', 'scale'
  )),
  content text not null,
  media_url text,
  options jsonb not null default '[]'::jsonb,
  correct_answer jsonb not null default '[]'::jsonb,
  feedback text,
  points integer not null default 1,
  "order" integer not null default 0
);

-- Submissions table
create table public.submissions (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  participant_name text,
  participant_info jsonb not null default '{}'::jsonb,
  score float not null default 0,
  passed boolean,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  time_spent integer not null default 0
);

-- Answers table
create table public.answers (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  response jsonb not null default '{}'::jsonb,
  is_correct boolean not null default false,
  time_spent integer not null default 0
);

-- Pages table
create table public.pages (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid references public.quizzes(id) on delete set null,
  title text not null,
  slug text unique not null,
  blocks jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_quizzes_admin_id on public.quizzes(admin_id);
create index idx_quizzes_status on public.quizzes(status);
create index idx_questions_quiz_id on public.questions(quiz_id);
create index idx_questions_order on public.questions(quiz_id, "order");
create index idx_submissions_quiz_id on public.submissions(quiz_id);
create index idx_answers_submission_id on public.answers(submission_id);
create index idx_pages_admin_id on public.pages(admin_id);
create index idx_pages_slug on public.pages(slug);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.submissions enable row level security;
alter table public.answers enable row level security;
alter table public.pages enable row level security;

-- Helper function: get current user's role
create or replace function public.get_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- PROFILES policies
create policy "Users can read own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

create policy "Managers can read all profiles"
  on public.profiles for select
  using (public.get_user_role() = 'manager');

create policy "Managers can delete any profile"
  on public.profiles for delete
  using (public.get_user_role() = 'manager');

create policy "Managers can update any profile"
  on public.profiles for update
  using (public.get_user_role() = 'manager');

-- QUIZZES policies
create policy "Admins can CRUD own quizzes"
  on public.quizzes for all
  using (admin_id = auth.uid());

create policy "Managers can CRUD all quizzes"
  on public.quizzes for all
  using (public.get_user_role() = 'manager');

create policy "Public can read published quizzes"
  on public.quizzes for select
  using (status = 'published');

-- QUESTIONS policies
create policy "Admins can CRUD own quiz questions"
  on public.questions for all
  using (quiz_id in (
    select id from public.quizzes where admin_id = auth.uid()
  ));

create policy "Managers can CRUD all questions"
  on public.questions for all
  using (public.get_user_role() = 'manager');

create policy "Public can read published quiz questions"
  on public.questions for select
  using (quiz_id in (
    select id from public.quizzes where status = 'published'
  ));

-- SUBMISSIONS policies
create policy "Admins can read own quiz submissions"
  on public.submissions for select
  using (quiz_id in (
    select id from public.quizzes where admin_id = auth.uid()
  ));

create policy "Managers can read all submissions"
  on public.submissions for select
  using (public.get_user_role() = 'manager');

create policy "Anyone can create submissions"
  on public.submissions for insert
  with check (true);

-- ANSWERS policies
create policy "Admins can read own quiz answers"
  on public.answers for select
  using (submission_id in (
    select s.id from public.submissions s
    join public.quizzes q on q.id = s.quiz_id
    where q.admin_id = auth.uid()
  ));

create policy "Managers can read all answers"
  on public.answers for select
  using (public.get_user_role() = 'manager');

create policy "Anyone can create answers"
  on public.answers for insert
  with check (true);

-- PAGES policies
create policy "Admins can CRUD own pages"
  on public.pages for all
  using (admin_id = auth.uid());

create policy "Managers can CRUD all pages"
  on public.pages for all
  using (public.get_user_role() = 'manager');

create policy "Public can read published pages"
  on public.pages for select
  using (status = 'published');

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, pseudo, role)
  values (
    new.id,
    new.raw_user_meta_data->>'pseudo',
    coalesce(new.raw_user_meta_data->>'role', 'admin')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_quizzes_updated_at
  before update on public.quizzes
  for each row execute function public.handle_updated_at();

create trigger set_pages_updated_at
  before update on public.pages
  for each row execute function public.handle_updated_at();

-- Storage bucket for media
insert into storage.buckets (id, name, public)
values ('media', 'media', true);

-- Storage policies
create policy "Admins can upload media"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and auth.uid() is not null
  );

create policy "Admins can update own media"
  on storage.objects for update
  using (
    bucket_id = 'media'
    and auth.uid() = owner
  );

create policy "Admins can delete own media"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and auth.uid() = owner
  );

create policy "Public can read media"
  on storage.objects for select
  using (bucket_id = 'media');
