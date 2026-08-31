-- RLS 隔離測試:任何一條斷言失敗都會 raise exception,讓 CI 中斷。
-- 情境:alice / bob 同群組,carol 是外人。

-- role 是 cluster 層級物件,重跑時可能已存在
do $do$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$do$;
grant usage on schema public, storage to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333');

insert into users (id, display_name) values
  ('11111111-1111-1111-1111-111111111111', 'Alice'),
  ('22222222-2222-2222-2222-222222222222', 'Bob'),
  ('33333333-3333-3333-3333-333333333333', 'Carol');

insert into groups (id, name, created_by) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '日本旅遊',
   '11111111-1111-1111-1111-111111111111');

insert into group_members (id, group_id, user_id, display_name, role) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '11111111-1111-1111-1111-111111111111', 'Alice', 'admin'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '22222222-2222-2222-2222-222222222222', 'Bob', 'member');

insert into expenses (id, group_id, description, total_amount, currency, split_type, created_by)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '晚餐', 1000, 'TWD', 'equal', '11111111-1111-1111-1111-111111111111');

insert into expense_splits (expense_id, member_id, owed_amount) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 500),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 500);

insert into entitlements (user_id, tier) values
  ('11111111-1111-1111-1111-111111111111', 'pro');

-- RLS 不套用在 table owner 上,必須切成一般 role 才測得到 policy。
set role authenticated;

do $$
declare
  n int;
  alice constant text := '11111111-1111-1111-1111-111111111111';
  bob   constant text := '22222222-2222-2222-2222-222222222222';
  carol constant text := '33333333-3333-3333-3333-333333333333';
begin
  -- 成員看得到自己群組的資料
  perform set_config('request.jwt.claim.sub', bob, true);
  select count(*) into n from groups;
  if n <> 1 then raise exception '成員應看到 1 個群組,實得 %', n; end if;
  select count(*) into n from expenses;
  if n <> 1 then raise exception '成員應看到 1 筆帳目,實得 %', n; end if;
  select count(*) into n from expense_splits;
  if n <> 2 then raise exception '成員應看到 2 筆拆帳,實得 %', n; end if;
  select count(*) into n from group_members;
  if n <> 2 then raise exception '成員應看到 2 位成員,實得 %', n; end if;

  -- 外人什麼都看不到
  perform set_config('request.jwt.claim.sub', carol, true);
  select count(*) into n from groups;
  if n <> 0 then raise exception 'RLS 破口:外人看得到 groups (%)', n; end if;
  select count(*) into n from expenses;
  if n <> 0 then raise exception 'RLS 破口:外人看得到 expenses (%)', n; end if;
  select count(*) into n from expense_splits;
  if n <> 0 then raise exception 'RLS 破口:外人看得到 expense_splits (%)', n; end if;
  select count(*) into n from group_members;
  if n <> 0 then raise exception 'RLS 破口:外人看得到 group_members (%)', n; end if;

  -- entitlements 只有本人看得到
  select count(*) into n from entitlements;
  if n <> 0 then raise exception 'RLS 破口:外人看得到 entitlements (%)', n; end if;
  perform set_config('request.jwt.claim.sub', alice, true);
  select count(*) into n from entitlements;
  if n <> 1 then raise exception '本人應看到自己的 entitlement,實得 %', n; end if;

  -- 金額相關表不得由 client 直寫(維持伺服器權威)
  perform set_config('request.jwt.claim.sub', bob, true);
  begin
    insert into expenses (group_id, description, total_amount, currency, split_type, created_by)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '偷寫', 999, 'TWD', 'equal', bob::uuid);
    raise exception 'RLS 破口:client 竟能直接寫入 expenses';
  exception
    when insufficient_privilege then null;  -- 預期被擋下
  end;

  raise notice '✓ 所有 RLS 斷言通過';
end $$;

reset role;
