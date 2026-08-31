-- 收據照片 Storage。
-- 路徑慣例:receipts/{group_id}/{expense_id}-{n}.jpg
--   → 第一層資料夾即 group_id,policy 據此判斷是否為群組成員。

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- 檔名第一段不一定是合法 uuid(例如使用者亂上傳),直接 cast 會讓整條 policy 報錯,
-- 因此包一層安全轉型:轉不動就回 null,交給 is_group_member 判為 false。
create or replace function safe_uuid(t text)
returns uuid
language plpgsql
immutable
as $$
begin
  return t::uuid;
exception
  when others then
    return null;
end;
$$;

create policy receipts_select_member on storage.objects
  for select using (
    bucket_id = 'receipts'
    and is_group_member(safe_uuid((storage.foldername(name))[1]))
  );

create policy receipts_insert_member on storage.objects
  for insert with check (
    bucket_id = 'receipts'
    and is_group_member(safe_uuid((storage.foldername(name))[1]))
  );

create policy receipts_delete_member on storage.objects
  for delete using (
    bucket_id = 'receipts'
    and is_group_member(safe_uuid((storage.foldername(name))[1]))
  );
