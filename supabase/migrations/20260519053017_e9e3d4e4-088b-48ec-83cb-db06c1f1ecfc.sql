create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  chosen_role public.app_role;
begin
  begin
    chosen_role := coalesce(
      (new.raw_user_meta_data ->> 'role')::public.app_role,
      'student'::public.app_role
    );
  exception when others then
    chosen_role := 'student'::public.app_role;
  end;

  -- Never allow self-assigning admin via signup metadata
  if chosen_role = 'admin'::public.app_role then
    chosen_role := 'student'::public.app_role;
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));

  insert into public.user_roles (user_id, role)
  values (new.id, chosen_role);

  return new;
end;
$$;