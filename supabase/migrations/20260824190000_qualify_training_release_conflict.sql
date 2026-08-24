-- Release failed with "column reference group_id is ambiguous".
-- RETURNS TABLE exposes group_id (and training_id on seed) as PL/pgSQL variables,
-- so ON CONFLICT (group_id, training_id) cannot see the table columns.
-- Point at the named unique constraints instead.

create or replace function internal.release_training_to_organizations(
  p_training_id uuid,
  p_released_by uuid,
  p_group_ids uuid[] default null
)
returns table (manager_id uuid, group_id uuid, is_new boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
  v_published boolean;
  v_group record;
  v_inserted integer;
  v_notify boolean;
begin
  select trainings.title, trainings.published
    into v_title, v_published
  from public.trainings
  where trainings.id = p_training_id;

  if v_title is null or v_published is not true then
    return;
  end if;

  update public.trainings
    set released_at = coalesce(released_at, now()),
        first_released_at = coalesce(first_released_at, now()),
        released_by = coalesce(p_released_by, released_by)
  where id = p_training_id;

  for v_group in
    select groups.id, groups.manager_id
    from public.groups
    where groups.manager_id is not null
      and (
        p_group_ids is null
        or cardinality(p_group_ids) = 0
        or groups.id = any (p_group_ids)
      )
    order by groups.name
  loop
    insert into public.organization_training_reviews (group_id, training_id, status)
    values (v_group.id, p_training_id, 'pending')
    on conflict on constraint organization_training_reviews_pkey do update
    set
      status = 'pending',
      decline_reason = null,
      decided_by = null,
      decided_at = null
    where public.organization_training_reviews.status = 'declined';

    get diagnostics v_inserted = row_count;
    is_new := v_inserted > 0;
    manager_id := v_group.manager_id;
    group_id := v_group.id;

    if v_inserted > 0 then
      select coalesce(prefs.training_releases, true)
        into v_notify
      from public.notification_preferences as prefs
      where prefs.user_id = v_group.manager_id;

      if coalesce(v_notify, true) then
        insert into public.manager_notifications (
          manager_id, group_id, training_id, kind, title, body, href
        ) values (
          v_group.manager_id,
          v_group.id,
          p_training_id,
          'training_release',
          'A new training is available for your review',
          v_title,
          '/manager/reviews/' || p_training_id::text
        );
      end if;
    end if;

    return next;
  end loop;
end;
$$;

create or replace function internal.seed_group_training_reviews(p_group_id uuid)
returns table (manager_id uuid, group_id uuid, training_id uuid, is_new boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_manager uuid;
  v_training record;
  v_inserted integer;
  v_notify boolean;
begin
  select groups.manager_id into v_manager
  from public.groups
  where groups.id = p_group_id;

  if v_manager is null then
    return;
  end if;

  for v_training in
    select trainings.id, trainings.title
    from public.trainings
    where trainings.published is true
      and trainings.released_at is not null
  loop
    insert into public.organization_training_reviews (group_id, training_id, status)
    values (p_group_id, v_training.id, 'pending')
    on conflict on constraint organization_training_reviews_pkey do nothing;

    get diagnostics v_inserted = row_count;
    is_new := v_inserted > 0;
    manager_id := v_manager;
    group_id := p_group_id;
    training_id := v_training.id;

    if v_inserted > 0 then
      select coalesce(prefs.training_releases, true)
        into v_notify
      from public.notification_preferences as prefs
      where prefs.user_id = v_manager;

      if coalesce(v_notify, true) then
        insert into public.manager_notifications (
          manager_id, group_id, training_id, kind, title, body, href
        ) values (
          v_manager,
          p_group_id,
          v_training.id,
          'training_release',
          'A new training is available for your review',
          v_training.title,
          '/manager/reviews/' || v_training.id::text
        );
      end if;
    end if;

    return next;
  end loop;
end;
$$;

revoke all on function internal.release_training_to_organizations(uuid, uuid, uuid[])
  from public, anon;
revoke all on function internal.seed_group_training_reviews(uuid)
  from public, anon;

grant execute on function internal.release_training_to_organizations(uuid, uuid, uuid[])
  to authenticated, service_role;
grant execute on function internal.seed_group_training_reviews(uuid)
  to authenticated, service_role;
