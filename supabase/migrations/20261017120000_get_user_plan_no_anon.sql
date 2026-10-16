-- Säkerhet (sweep 2026-10-17): get_user_plan är SECURITY DEFINER och tar ett godtyckligt
-- användar-id, så anonyma besökare kunde läsa vilken plan och hur många chattar en användare har.
-- Funktionen används bara av triggers vid skapande av chattinstanser (inloggad användare).
revoke all on function public.get_user_plan(uuid) from public, anon;
grant execute on function public.get_user_plan(uuid) to authenticated, service_role;
