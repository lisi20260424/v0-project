-- 生成任务表：存放用户图片/视频/音乐生成任务
-- 同步任务（图片/音乐）：创建时立即调用网关，存好结果后置为 success
-- 异步任务（视频）：创建时调用网关获取上游 task_id，置为 running，由前端定时调用 /api/tasks/[id]/poll 轮询上游状态

create table if not exists public.generation_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 类型与展示信息（snapshot，避免后续模型/供应商被删除导致历史任务无法展示）
  type text not null check (type in ('video', 'image', 'music')),
  model_id uuid references public.admin_models(id) on delete set null,
  model_name text not null,
  provider_name text,
  tool_label text, -- 例如："Veo 3.1 · 文生视频"
  -- 提示词与参数
  prompt text not null,
  params jsonb not null default '{}'::jsonb,
  -- 状态机：queued -> running -> success/failed
  status text not null default 'queued' check (status in ('queued', 'running', 'success', 'failed')),
  progress integer not null default 0 check (progress between 0 and 100),
  -- 异步任务上游 ID 与原始响应
  provider_task_id text,
  provider_raw jsonb,
  -- 结果数据
  result_urls text[] not null default '{}',
  result_data jsonb,
  -- 计费与错误
  cost integer not null default 0,
  error_message text,
  -- 时间戳
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  last_polled_at timestamptz
);

create index if not exists generation_tasks_user_created_idx
  on public.generation_tasks (user_id, created_at desc);
create index if not exists generation_tasks_status_idx
  on public.generation_tasks (status)
  where status in ('queued', 'running');
create index if not exists generation_tasks_provider_task_idx
  on public.generation_tasks (provider_task_id);

alter table public.generation_tasks enable row level security;

-- 只允许用户读自己的任务
drop policy if exists generation_tasks_select_own on public.generation_tasks;
create policy generation_tasks_select_own
  on public.generation_tasks
  for select
  using (auth.uid() = user_id);

-- 用户可以创建自己的任务
drop policy if exists generation_tasks_insert_own on public.generation_tasks;
create policy generation_tasks_insert_own
  on public.generation_tasks
  for insert
  with check (auth.uid() = user_id);

-- 用户可以更新/删除自己的任务（取消、删除记录）
drop policy if exists generation_tasks_update_own on public.generation_tasks;
create policy generation_tasks_update_own
  on public.generation_tasks
  for update
  using (auth.uid() = user_id);

drop policy if exists generation_tasks_delete_own on public.generation_tasks;
create policy generation_tasks_delete_own
  on public.generation_tasks
  for delete
  using (auth.uid() = user_id);

-- 自动维护 updated_at
create or replace function public.touch_generation_tasks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_generation_tasks_touch on public.generation_tasks;
create trigger trg_generation_tasks_touch
  before update on public.generation_tasks
  for each row execute function public.touch_generation_tasks_updated_at();
