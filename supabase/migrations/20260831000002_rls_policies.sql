-- Row Level Security:多租戶隔離的**最後防線**(見 docs/05 §8)。
--
-- 原則:
--   * 使用者只能存取自己所屬群組 / 好友關係內的資料。
--   * 涉及金額的寫入(expenses / splits / payers / settlements)**不開放 client 直寫**,
--     一律走 Edge Function(service role,會繞過 RLS)在交易內驗證後寫入,
--     以維持「金額計算伺服器權威」。因此這些表只給 SELECT policy。
--   * entitlements 只能由 RevenueCat webhook (service role) 寫入,使用者唯讀。

-- ------------------------------------------------- helper(避免 policy 遞迴)
-- group_members 的 policy 若直接查 group_members 會無限遞迴,
-- 因此用 SECURITY DEFINER 繞過 RLS。固定 search_path 以防注入。
create or replace function is_group_member(gid uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

create or replace function is_group_admin(gid uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from group_members
    where group_id = gid and user_id = auth.uid() and role = 'admin'
  );
$$;

-- 某筆 expense 所屬的群組,使用者是否為成員
create or replace function can_access_expense(eid uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from expenses e
    join group_members m on m.group_id = e.group_id
    where e.id = eid and m.user_id = auth.uid()
  );
$$;

-- --------------------------------------------------------- 啟用 RLS(全表)
alter table users           enable row level security;
alter table groups          enable row level security;
alter table group_members   enable row level security;
alter table friendships     enable row level security;
alter table categories      enable row level security;
alter table expenses        enable row level security;
alter table expense_payers  enable row level security;
alter table expense_splits  enable row level security;
alter table settlements     enable row level security;
alter table comments        enable row level security;
alter table activities      enable row level security;
alter table entitlements    enable row level security;
alter table push_tokens     enable row level security;

-- ---------------------------------------------------------------------- users
-- 本人可讀寫自己;同群組成員可讀彼此的基本檔案(顯示名 / 頭像)。
create policy users_select_self_or_groupmate on users
  for select using (
    id = auth.uid()
    or exists (
      select 1
      from group_members mine
      join group_members theirs on theirs.group_id = mine.group_id
      where mine.user_id = auth.uid() and theirs.user_id = users.id
    )
  );

create policy users_insert_self on users
  for insert with check (id = auth.uid());

create policy users_update_self on users
  for update using (id = auth.uid()) with check (id = auth.uid());

-- --------------------------------------------------------------------- groups
create policy groups_select_member on groups
  for select using (is_group_member(id));

-- 建立者必須是自己;建立後需立刻把自己加為 admin 成員(由 App/Function 處理)
create policy groups_insert_self on groups
  for insert with check (created_by = auth.uid());

create policy groups_update_admin on groups
  for update using (is_group_admin(id)) with check (is_group_admin(id));

create policy groups_delete_admin on groups
  for delete using (is_group_admin(id));

-- -------------------------------------------------------------- group_members
create policy group_members_select_member on group_members
  for select using (is_group_member(group_id));

-- 允許把自己加進剛建立的群組(此時尚無其他成員,is_group_admin 會是 false),
-- 其餘情況只有 admin 能增減成員。
create policy group_members_insert on group_members
  for insert with check (
    is_group_admin(group_id)
    or (
      user_id = auth.uid()
      and exists (select 1 from groups g where g.id = group_id and g.created_by = auth.uid())
    )
  );

create policy group_members_update_admin on group_members
  for update using (is_group_admin(group_id)) with check (is_group_admin(group_id));

create policy group_members_delete_admin on group_members
  for delete using (is_group_admin(group_id));

-- ---------------------------------------------------------------- friendships
create policy friendships_select_own on friendships
  for select using (user_id = auth.uid() or friend_id = auth.uid());

create policy friendships_insert_own on friendships
  for insert with check (user_id = auth.uid());

create policy friendships_update_own on friendships
  for update using (user_id = auth.uid() or friend_id = auth.uid());

create policy friendships_delete_own on friendships
  for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------- categories
-- 內建分類(group_id 為 null)所有人可讀;群組自訂分類僅成員可讀、admin 可改。
create policy categories_select on categories
  for select using (group_id is null or is_group_member(group_id));

create policy categories_insert_admin on categories
  for insert with check (group_id is not null and is_group_admin(group_id));

create policy categories_update_admin on categories
  for update using (group_id is not null and is_group_admin(group_id));

create policy categories_delete_admin on categories
  for delete using (group_id is not null and is_group_admin(group_id));

-- ------------------------------------------------- 金額相關表:僅開放 SELECT
-- 寫入一律走 Edge Function(service role),以確保伺服器權威計算與交易一致性。
create policy expenses_select_member on expenses
  for select using (is_group_member(group_id));

create policy expense_payers_select_member on expense_payers
  for select using (can_access_expense(expense_id));

create policy expense_splits_select_member on expense_splits
  for select using (can_access_expense(expense_id));

create policy settlements_select_member on settlements
  for select using (is_group_member(group_id));

create policy activities_select_member on activities
  for select using (is_group_member(group_id));

-- ------------------------------------------------------------------- comments
-- 純文字、不涉及金額,允許成員直接寫;只能刪改自己的。
create policy comments_select_member on comments
  for select using (can_access_expense(expense_id));

create policy comments_insert_member on comments
  for insert with check (author_id = auth.uid() and can_access_expense(expense_id));

create policy comments_update_own on comments
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy comments_delete_own on comments
  for delete using (author_id = auth.uid());

-- --------------------------------------------------------------- entitlements
-- 使用者唯讀;沒有 insert/update policy → 只有 service role(webhook)能寫。
create policy entitlements_select_own on entitlements
  for select using (user_id = auth.uid());

-- ---------------------------------------------------------------- push_tokens
create policy push_tokens_select_own on push_tokens
  for select using (user_id = auth.uid());

create policy push_tokens_insert_own on push_tokens
  for insert with check (user_id = auth.uid());

create policy push_tokens_delete_own on push_tokens
  for delete using (user_id = auth.uid());
