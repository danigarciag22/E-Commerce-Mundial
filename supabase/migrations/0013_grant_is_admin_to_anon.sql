-- The "admins manage discounts" policy (FOR ALL) calls is_admin() and applies to
-- SELECT as well. When an anon shopper reads discounts, Postgres evaluates that
-- policy's USING expression and calls is_admin() — but anon lacked EXECUTE on it,
-- so the whole query failed with "permission denied for function is_admin",
-- defeating the "anyone reads active discounts" permissive policy.
--
-- is_admin() is SECURITY DEFINER and returns false for anon (auth.uid() is null),
-- so granting EXECUTE to anon is safe and lets the active-read policy work.
grant execute on function public.is_admin() to anon;
