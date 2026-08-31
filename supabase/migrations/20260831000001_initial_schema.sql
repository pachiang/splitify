-- Splitify 初始 schema
--
-- 設計鐵則(見 docs/05-data-model.md):
--   * 金額一律以「最小貨幣單位的整數」(minor units) 存於 bigint,禁用浮點。
--   * 每筆帶金額的資料都帶 currency;小數位由 packages/shared 的幣別表決定。
--   * 好友 1:1 分帳以「隱含的雙人群組」(groups.type = 'friend') 表示,
--     因此 expenses.group_id 一律 NOT NULL —— 這樣 expense_splits 才能
--     一致地指向 group_members。

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- 共用 trigger
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------- users
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) > 0),
  email text,
  avatar_url text,
  default_currency text not null default 'TWD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on users
  for each row execute function set_updated_at();

-- --------------------------------------------------------------------- groups
create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  -- friend = 好友 1:1 的隱含群組(UI 不顯示為一般群組)
  type text not null default 'general'
    check (type in ('general', 'trip', 'home', 'couple', 'friend')),
  default_currency text not null default 'TWD',
  simplify_debts boolean not null default true,
  cover_url text,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create trigger groups_set_updated_at
  before update on groups
  for each row execute function set_updated_at();

-- ------------------------------------------------------------- group_members
-- user_id 為 null = 尚未註冊的「佔位成員」;對方註冊後再把 user_id 綁上。
create table group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  display_name text not null check (length(trim(display_name)) > 0),
  role text not null default 'member' check (role in ('admin', 'member')),
  invited_email text,
  joined_at timestamptz not null default now()
);

-- 同一群組內同一個 user 只能有一列(佔位成員 user_id 為 null,不受此限)
create unique index group_members_group_user_uniq
  on group_members (group_id, user_id)
  where user_id is not null;
create index group_members_user_idx on group_members (user_id);
create index group_members_group_idx on group_members (group_id);

-- ---------------------------------------------------------------- friendships
create table friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  friend_id uuid not null references users(id) on delete cascade,
  -- 好友之間共用的隱含群組
  group_id uuid references groups(id) on delete set null,
  status text not null default 'active'
    check (status in ('pending', 'active', 'blocked')),
  created_at timestamptz not null default now(),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

-- ----------------------------------------------------------------- categories
-- group_id 為 null = 系統內建分類;非 null = 該群組自訂分類 [Pro]
create table categories (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  key text not null,
  label text not null,
  icon text,
  sort int not null default 0
);

create index categories_group_idx on categories (group_id);

-- ------------------------------------------------------------------- expenses
create table expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  description text not null check (length(trim(description)) > 0),
  total_amount bigint not null check (total_amount > 0),
  currency text not null,
  category_id uuid references categories(id) on delete set null,
  expense_date date not null default current_date,
  split_type text not null
    check (split_type in ('equal', 'exact', 'percentage', 'shares', 'itemized', 'adjustment')),
  -- 各拆帳法的原始設定(百分比 / 份數 / 明細…),供編輯時還原
  split_config jsonb,
  receipt_url text,
  notes text,
  recurring_rule jsonb,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger expenses_set_updated_at
  before update on expenses
  for each row execute function set_updated_at();

create index expenses_group_date_idx on expenses (group_id, expense_date desc);
create index expenses_group_active_idx on expenses (group_id) where deleted_at is null;

-- -------------------------------------------------------------- expense_payers
-- 誰付了多少。不變量:sum(paid_amount) = expenses.total_amount
-- (跨列不變量由 Edge Function 於交易內驗證,見 docs/08)
create table expense_payers (
  expense_id uuid not null references expenses(id) on delete cascade,
  member_id uuid not null references group_members(id) on delete cascade,
  paid_amount bigint not null check (paid_amount > 0),
  primary key (expense_id, member_id)
);

create index expense_payers_member_idx on expense_payers (member_id);

-- -------------------------------------------------------------- expense_splits
-- 誰該分攤多少。不變量:sum(owed_amount) = expenses.total_amount
create table expense_splits (
  expense_id uuid not null references expenses(id) on delete cascade,
  member_id uuid not null references group_members(id) on delete cascade,
  owed_amount bigint not null check (owed_amount >= 0),
  primary key (expense_id, member_id)
);

create index expense_splits_member_idx on expense_splits (member_id);

-- ---------------------------------------------------------------- settlements
-- 只記錄「誰付給誰」,不經手真實資金(見 docs/01 非目標)。
create table settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  from_member uuid not null references group_members(id) on delete cascade,
  to_member uuid not null references group_members(id) on delete cascade,
  amount bigint not null check (amount > 0),
  currency text not null,
  method text check (method in ('cash', 'linepay', 'transfer', 'other')),
  note text,
  settled_at timestamptz not null default now(),
  created_by uuid not null references users(id),
  check (from_member <> to_member)
);

create index settlements_group_idx on settlements (group_id, settled_at desc);

-- ------------------------------------------------------------------- comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  author_id uuid not null references users(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index comments_expense_idx on comments (expense_id, created_at);

-- ----------------------------------------------------------------- activities
create table activities (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  actor_id uuid references users(id) on delete set null,
  type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index activities_group_idx on activities (group_id, created_at desc);

-- --------------------------------------------------------------- entitlements
-- 付費權益的**伺服器端真相**,只由 RevenueCat webhook (service role) 寫入。
create table entitlements (
  user_id uuid primary key references users(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  status text check (status in ('active', 'trial', 'expired', 'grace')),
  store text check (store in ('app_store', 'play_store')),
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create trigger entitlements_set_updated_at
  before update on entitlements
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------- push_tokens
create table push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  unique (user_id, token)
);

-- ------------------------------------------------------------ 內建分類 seed
insert into categories (group_id, key, label, icon, sort) values
  (null, 'food',      '餐飲',   '🍽️', 10),
  (null, 'transport', '交通',   '🚕', 20),
  (null, 'lodging',   '住宿',   '🏨', 30),
  (null, 'shopping',  '購物',   '🛍️', 40),
  (null, 'utilities', '水電雜支', '💡', 50),
  (null, 'rent',      '房租',   '🏠', 60),
  (null, 'ticket',    '票券娛樂', '🎟️', 70),
  (null, 'other',     '其他',   '📦', 99);
