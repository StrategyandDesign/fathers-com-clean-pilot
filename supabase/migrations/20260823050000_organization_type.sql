-- Organization type taxonomy for vertical-pack config.
-- Super-admin picks a type when minting an organization. Type recommends
-- default flags (Expected vs Open participation, pack) only. Desk routes stay one spine.

alter table public.groups
  add column if not exists organization_type text;

alter table public.manager_invites
  add column if not exists organization_type text;

do $$
begin
  alter table public.groups
    add constraint groups_organization_type_check
    check (
      organization_type is null
      or organization_type in (
        'rehab',
        'armed_forces_unit',
        'performance_optimization_group',
        'other'
      )
    );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter table public.manager_invites
    add constraint manager_invites_organization_type_check
    check (
      organization_type is null
      or organization_type in (
        'rehab',
        'armed_forces_unit',
        'performance_optimization_group',
        'other'
      )
    );
exception
  when duplicate_object then null;
end
$$;

comment on column public.groups.organization_type is
  'Taxonomy for vertical packs as config: rehab, armed_forces_unit, performance_optimization_group, or other. Recommends default flags only. Does not fork Desk routes.';

comment on column public.manager_invites.organization_type is
  'Type chosen when Super-admin mints an organization by invite. Copied onto groups when the leader joins.';

update public.groups
set organization_type = 'rehab'
where organization_type is null
  and (
    code = 'NWA'
    or name = 'Returning Home NWA'
    or name ilike 'returning home%'
  );
