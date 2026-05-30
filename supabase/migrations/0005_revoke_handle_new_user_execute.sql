-- handle_new_user runs only via the auth.users trigger; it must not be a public RPC.
revoke execute on function public.handle_new_user() from anon, authenticated, public;
