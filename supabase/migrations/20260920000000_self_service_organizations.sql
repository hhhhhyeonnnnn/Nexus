-- Authenticated self-service creation; organization + president commit together.
begin;

create function public.create_organization(p_name text, p_university_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  new_organization uuid;
begin
  if actor is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;
  if p_name is null or length(btrim(p_name)) not between 1 and 100
    or p_university_name is null or length(btrim(p_university_name)) not between 1 and 100 then
    raise exception '대학교와 학생회 이름은 1~100자로 입력해 주세요.' using errcode = '22023';
  end if;

  -- Serialize requests from the same account, including double-clicks/retries.
  perform 1 from public.profiles where id = actor for update;
  if not found then
    raise exception '프로필을 찾을 수 없습니다. 다시 로그인해 주세요.' using errcode = '42501';
  end if;
  if exists (select 1 from public.organization_members where user_id = actor) then
    raise exception '이미 소속된 학생회가 있습니다.' using errcode = '23505';
  end if;

  insert into public.organizations(name, university_name)
  values (btrim(p_name), btrim(p_university_name)) returning id into new_organization;
  insert into public.organization_members(organization_id, user_id, role)
  values (new_organization, actor, 'PRESIDENT');

  -- Old requests must not create a second organization after self-service signup.
  update public.organization_creation_requests
    set status = 'rejected', reviewed_at = now()
    where requester_id = actor and status = 'pending';
  return new_organization;
end;
$$;

revoke all on function public.create_organization(text, text) from public, anon;
grant execute on function public.create_organization(text, text) to authenticated;
-- Keep the legacy request policy until the previous deployed UI is retired.

commit;
