-- Customer address fields: street_name, street_number, postal_code, city.
-- Run in the Supabase SQL editor. No RLS, policy, grant or auth changes.
--
-- All columns are text NOT NULL DEFAULT '':
--   - existing rows are filled with '' by the ADD COLUMN itself, so getCustomer(s) always gets strings
--     (matches the non-optional `string` fields in types/customer.ts).
--   - inserts that omit the fields (e.g. app/createCustomerModal.tsx today) still succeed.
--   - postal_code / street_number are text, not int: keeps leading zeros and values like "12B".

begin;

alter table public.customers
  add column if not exists street_name   text not null default '',
  add column if not exists street_number text not null default '',
  add column if not exists postal_code   text not null default '',
  add column if not exists city          text not null default '';

-- Safety net in case any of the columns already existed as nullable.
update public.customers set street_name = ''   where street_name is null;
update public.customers set street_number = '' where street_number is null;
update public.customers set postal_code = ''   where postal_code is null;
update public.customers set city = ''          where city is null;

commit;

-- VERIFY (read-only): expect 4 rows, is_nullable = NO, and 0 nulls.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'customers'
  and column_name in ('street_name', 'street_number', 'postal_code', 'city');

select count(*) as customers_with_null_address
from public.customers
where street_name is null or street_number is null or postal_code is null or city is null;

-- ROLLBACK (only if needed):
-- alter table public.customers
--   drop column if exists street_name,
--   drop column if exists street_number,
--   drop column if exists postal_code,
--   drop column if exists city;
