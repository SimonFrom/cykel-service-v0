-- Feature 19: repair discounts and persisted total price.
-- Run in the Supabase SQL editor. One transaction: any failure leaves nothing behind (SR-8).
-- No RLS, policy, grant or auth changes (SR-10).

begin;

-- 1. Preflight ---------------------------------------------------------------------------------
-- Paste this output into docs/features/19-repair-discounts/status.md.

select table_name, column_name, data_type, numeric_precision, numeric_scale
from information_schema.columns
where table_schema = 'public'
  and ((table_name = 'repairs' and column_name = 'total_price')
    or (table_name = 'repair_items' and column_name in ('price', 'quantity', 'total')))
order by table_name, column_name;

select c.relname, c.relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('repairs', 'repair_items');

select * from pg_policies where tablename in ('repairs', 'repair_items');

-- Abort unless the money columns are numeric (no type conversion is done here).
do $$
declare
  bad text;
begin
  select string_agg(table_name || '.' || column_name || ' is ' || data_type, ', ')
    into bad
  from information_schema.columns
  where table_schema = 'public'
    and ((table_name = 'repairs' and column_name = 'total_price')
      or (table_name = 'repair_items' and column_name in ('price', 'total')))
    and data_type <> 'numeric';

  if bad is not null then
    raise exception 'Preflight failed, expected numeric: %', bad;
  end if;
end $$;

-- Rows that would fail step 7 (backfill fixes total and total_price, so only these remain).
select count(*) as items_failing_validation
from public.repair_items
where price < 0 or quantity <= 0;

-- 2. Backup of old totals (SR-9) ----------------------------------------------------------------
-- "private" is not exposed by PostgREST. If your project exposes it, also run (no policies):
--   alter table private.repair_items_total_backup_19 enable row level security;
--   alter table private.repairs_total_price_backup_19 enable row level security;

create schema if not exists private;

create table private.repair_items_total_backup_19 as
  select id, total from public.repair_items;

create table private.repairs_total_price_backup_19 as
  select id, total_price from public.repairs;

-- 3. New columns --------------------------------------------------------------------------------

alter table public.repairs
  add column discount_type text null,
  add column discount_value numeric(10, 2) not null default 0;

alter table public.repair_items
  add column discount_type text null,
  add column discount_value numeric(10, 2) not null default 0;

-- 4. Constraints on new columns (all existing rows are null / 0, so they validate) -------------

alter table public.repairs
  add constraint repairs_discount_type_chk
    check (discount_type in ('percent', 'amount')),
  add constraint repairs_discount_value_nonneg_chk
    check (discount_value >= 0),
  add constraint repairs_discount_pct_max_chk
    check (discount_type is distinct from 'percent' or discount_value <= 100),
  add constraint repairs_discount_consistency_chk
    check ((discount_type is null) = (discount_value = 0));

alter table public.repair_items
  add constraint repair_items_discount_type_chk
    check (discount_type in ('percent', 'amount')),
  add constraint repair_items_discount_value_nonneg_chk
    check (discount_value >= 0),
  add constraint repair_items_discount_pct_max_chk
    check (discount_type is distinct from 'percent' or discount_value <= 100),
  add constraint repair_items_discount_consistency_chk
    check ((discount_type is null) = (discount_value = 0)),
  add constraint repair_items_discount_amount_max_chk
    check (discount_type is distinct from 'amount'
           or discount_value <= round(price * quantity, 2));

-- 5. Constraints on existing columns, NOT VALID until the backfill has run -----------------------

alter table public.repair_items
  add constraint repair_items_total_bounds_chk
    check (total >= 0 and total <= round(price * quantity, 2)) not valid,
  add constraint repair_items_price_nonneg_chk
    check (price >= 0) not valid,
  add constraint repair_items_quantity_pos_chk
    check (quantity > 0) not valid;

alter table public.repairs
  add constraint repairs_total_price_nonneg_chk
    check (total_price >= 0) not valid;

-- 6. Backfill (AC-15): no discounts existed, so net = gross -------------------------------------

update public.repair_items
set total = round(price * quantity, 2);

update public.repairs r
set total_price = coalesce(
  (select sum(i.total) from public.repair_items i where i.repair_id = r.id),
  0
);

-- 7. Validate (a failure aborts the whole transaction, AC-23) ------------------------------------

alter table public.repair_items validate constraint repair_items_total_bounds_chk;
alter table public.repair_items validate constraint repair_items_price_nonneg_chk;
alter table public.repair_items validate constraint repair_items_quantity_pos_chk;
alter table public.repairs validate constraint repairs_total_price_nonneg_chk;

-- 8. Done ---------------------------------------------------------------------------------------

commit;

-- Rollback (run as one transaction; keep the backup tables until Gate 2 is passed) ---------------
-- begin;
--
-- update public.repair_items i
--   set total = b.total
--   from private.repair_items_total_backup_19 b
--   where b.id = i.id;
-- update public.repairs r
--   set total_price = b.total_price
--   from private.repairs_total_price_backup_19 b
--   where b.id = r.id;
--
-- alter table public.repairs
--   drop constraint repairs_discount_type_chk,
--   drop constraint repairs_discount_value_nonneg_chk,
--   drop constraint repairs_discount_pct_max_chk,
--   drop constraint repairs_discount_consistency_chk,
--   drop constraint repairs_total_price_nonneg_chk;
-- alter table public.repair_items
--   drop constraint repair_items_discount_type_chk,
--   drop constraint repair_items_discount_value_nonneg_chk,
--   drop constraint repair_items_discount_pct_max_chk,
--   drop constraint repair_items_discount_consistency_chk,
--   drop constraint repair_items_discount_amount_max_chk,
--   drop constraint repair_items_total_bounds_chk,
--   drop constraint repair_items_price_nonneg_chk,
--   drop constraint repair_items_quantity_pos_chk;
--
-- alter table public.repairs
--   drop column discount_type,
--   drop column discount_value;
-- alter table public.repair_items
--   drop column discount_type,
--   drop column discount_value;
--
-- commit;
--
-- Only after Gate 2, once the old totals are no longer needed:
-- drop table private.repair_items_total_backup_19;
-- drop table private.repairs_total_price_backup_19;
