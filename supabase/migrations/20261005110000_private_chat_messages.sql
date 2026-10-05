-- Alla meddelanden i alla publika chattar (slug satt) kunde läsas av vem
-- som helst, och get_chat_users gav ut användarnas e-post för valfri chatt.
-- Nu läser besökare bara sina egna sessioner via get_session_messages (de
-- känner sitt slumpmässiga session-id), och bara ägaren kan lista användare.
create or replace function public.get_session_messages(p_chat_instance_id uuid, p_session_ids text[])
returns setof public.chat_messages
language sql
stable
security definer
set search_path = public
as $$
  select m.*
    from public.chat_messages m
    join public.chat_instances ci on ci.id = m.chat_instance_id
   where m.chat_instance_id = p_chat_instance_id
     and m.session_id = any(p_session_ids)
     and (ci.slug is not null or ci.user_id = auth.uid())
   order by m.created_at
$$;
revoke execute on function public.get_session_messages(uuid, text[]) from public;
grant execute on function public.get_session_messages(uuid, text[]) to anon, authenticated;

create or replace function public.get_chat_users(chat_instance_id_param uuid)
returns table(user_id uuid, email text, display_name text, avatar_url text, claimed_at timestamptz, last_active timestamptz, total_messages bigint)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not exists (select 1 from chat_instances ci where ci.id = chat_instance_id_param and ci.user_id = auth.uid()) then
    return;
  end if;
  return query
  select us.user_id, au.email, p.display_name, p.avatar_url, us.claimed_at,
         max(cm.created_at) as last_active, count(cm.id) as total_messages
    from user_sessions us
    left join auth.users au on au.id = us.user_id
    left join profiles p on p.id = us.user_id
    left join chat_messages cm on cm.session_id = us.session_id
   where us.chat_instance_id = chat_instance_id_param
   group by us.user_id, au.email, p.display_name, p.avatar_url, us.claimed_at
   order by us.claimed_at desc;
end;
$function$;
revoke execute on function public.get_chat_users(uuid) from public, anon;
grant execute on function public.get_chat_users(uuid) to authenticated;

drop policy if exists "Anyone can view public chat messages" on public.chat_messages;
