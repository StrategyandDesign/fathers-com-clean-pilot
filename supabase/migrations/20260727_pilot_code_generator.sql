-- ============================================================================
-- STEP 2 of 2. Participant code generator, in SQL.
--
-- Run this in the Supabase SQL editor AFTER the pilot_participant migration.
-- It creates two functions and issues no codes by itself.
--
-- Why SQL and not a script: no terminal required, and no code ever passes
-- through a chat window, a download, or a laptop.
--
-- Why no PINs here: each man sets his own PIN the first time he signs in.
-- Generating PINs in the SQL editor would write them into Supabase's query
-- history, which is the last place a secret should live. Returning Home's
-- sheet therefore carries nothing secret. Just codes, and the names they
-- write beside them.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Luhn mod 32 over the Crockford alphabet.
-- Catches 100% of single-character typos and 99.79% of adjacent transpositions.
-- ---------------------------------------------------------------------------
create or replace function pilot_check_char(payload text)
returns text
language plpgsql
immutable
as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  base     constant int  := 32;
  factor   int := 2;
  total    int := 0;
  addend   int;
  i        int;
begin
  for i in reverse length(payload)..1 loop
    addend := factor * (position(substr(payload, i, 1) in alphabet) - 1);
    factor := case when factor = 2 then 1 else 2 end;
    addend := (addend / base) + (addend % base);
    total  := total + addend;
  end loop;
  return substr(alphabet, ((base - (total % base)) % base) + 1, 1);
end $$;


create or replace function pilot_code_valid(code text)
returns boolean
language plpgsql
immutable
as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  base     constant int  := 32;
  factor   int := 1;
  total    int := 0;
  addend   int;
  i        int;
begin
  code := upper(replace(replace(code, '-', ''), ' ', ''));
  if code !~ '^[0-9A-HJKMNP-TV-Z]{7}$' then
    return false;
  end if;
  for i in reverse 7..1 loop
    addend := factor * (position(substr(code, i, 1) in alphabet) - 1);
    factor := case when factor = 1 then 2 else 1 end;
    addend := (addend / base) + (addend % base);
    total  := total + addend;
  end loop;
  return (total % base) = 0;
end $$;


-- ---------------------------------------------------------------------------
-- Issue codes into a cohort. Returns the codes it created.
--   select * from pilot_issue_codes('rh-2026-fall', 40);
-- Returns one column, participant_code.
-- ---------------------------------------------------------------------------
create or replace function pilot_issue_codes(p_cohort text, p_count int)
returns table (participant_code text)
language plpgsql
as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  blocked  constant text[] := array[
    'FAG','FCK','SHT','AZZ','SEX','GAY','NGR','KKK',
    'DED','DIE','RAT','CON','FELON','SNTCH'
  ];
  candidate text;
  payload   text;
  made      int := 0;
  guard     int := 0;
  bad       text;
  ok        boolean;
begin
  if p_count < 1 or p_count > 5000 then
    raise exception 'p_count must be between 1 and 5000, got %', p_count;
  end if;
  if p_cohort is null or length(trim(p_cohort)) = 0 then
    raise exception 'p_cohort is required';
  end if;

  create temp table _issued (code text) on commit drop;

  while made < p_count loop
    guard := guard + 1;
    if guard > p_count * 100 then
      raise exception 'generator failed to converge after % attempts', guard;
    end if;

    -- Six random characters, drawn with gen_random_bytes (pgcrypto, CSPRNG).
    payload := '';
    for i in 1..6 loop
      payload := payload || substr(alphabet, (get_byte(gen_random_bytes(1), 0) % 32) + 1, 1);
    end loop;
    candidate := payload || pilot_check_char(payload);

    -- Blocklist runs against the FULL code. The check character is appended
    -- last, so a payload ending CO with a check character N spells CON.
    ok := true;
    foreach bad in array blocked loop
      if position(bad in candidate) > 0 then ok := false; exit; end if;
    end loop;
    if not ok then continue; end if;

    -- Conflict target is the primary key, a plain unique index. Never partial.
    -- The output column is named participant_code, not code: a plpgsql output
    -- variable called "code" makes "on conflict (code)" ambiguous and the
    -- function fails at runtime, not at creation time.
    insert into pilot_participant as pp (code, cohort)
    values (candidate, p_cohort)
    on conflict (code) do nothing;

    if found then
      insert into _issued values (candidate);
      made := made + 1;
    end if;
  end loop;

  return query select i.code from _issued i order by i.code;
end $$;
