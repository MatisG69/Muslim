-- Backfill : crée un profil pour chaque utilisateur existant qui n'en a pas.
-- À exécuter une seule fois après halaqa.sql, pour les comptes créés AVANT la migration.
-- Idempotent : peut être rejoué sans risque.

do $$
declare
  u             record;
  base_username text;
  candidate     text;
  suffix        int;
begin
  for u in
    select au.id, au.email, au.raw_user_meta_data
    from auth.users au
    left join public.profiles p on p.id = au.id
    where p.id is null
  loop
    base_username := lower(regexp_replace(split_part(coalesce(u.email, ''), '@', 1), '[^a-z0-9_]', '', 'g'));
    if length(base_username) < 3 then
      base_username := 'mu_' || substr(replace(u.id::text, '-', ''), 1, 8);
    end if;
    base_username := substr(base_username, 1, 20);
    candidate := base_username;
    suffix := 0;

    while exists (select 1 from public.profiles where username = candidate) loop
      suffix := suffix + 1;
      candidate := substr(base_username, 1, 20) || suffix::text;
    end loop;

    insert into public.profiles (id, username, display_name)
    values (
      u.id,
      candidate,
      coalesce(u.raw_user_meta_data->>'display_name', candidate)
    );
  end loop;
end $$;

-- Vérification : combien de profils existent maintenant ?
select count(*) as total_profiles from public.profiles;
