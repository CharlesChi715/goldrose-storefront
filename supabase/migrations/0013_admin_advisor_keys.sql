-- ----------------------------------------------------------------------------
-- 0013 — advisor API keys (docs/advisor/BLUEPRINT-agent-advisor.md).
--
-- Each admin brings their own Anthropic key so each boss funds their own
-- advisor usage. One row per admin: "overwrite your key" is then an UPDATE,
-- not an insert-plus-mark-the-old-one-inactive state machine.
--
-- WHY THE KEY IS NOT IN THIS TABLE.
-- secret_id points into Supabase Vault; the ciphertext and its encryption key
-- both live outside this schema. A dump of public.* therefore yields uuids and
-- nothing else. The alternative — pgcrypto in a column here — would put the
-- passphrase in an env var, so a leaked dump AND a leaked env would together
-- expose every boss's key. Vault removes that pairing from our hands.
--
-- WHY RLS HAS NO POLICY.
-- Same reasoning as search_queries (0012): the only reader is our own server
-- on service credentials, which bypasses RLS anyway, so a per-owner policy
-- would be dead code that never evaluates. RLS enabled with no policy makes
-- Postgres deny every other role outright — the anon storefront key included.
-- Per-owner scoping is enforced where it can actually run: every query in
-- lib/advisor/keys.ts filters by the session's user id.
-- ----------------------------------------------------------------------------

create table if not exists admin_advisor_keys (
  user_id uuid primary key references auth.users (id) on delete cascade,
  secret_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger admin_advisor_keys_touch_updated_at
  before update on admin_advisor_keys
  for each row execute function touch_updated_at();

alter table public.admin_advisor_keys enable row level security;

-- ----------------------------------------------------------------------------
-- Vault access wrappers.
--
-- supabase-js cannot query the `vault` schema, so saving and reading a key go
-- through these two functions. They are SECURITY DEFINER — they run with the
-- owner's rights, which is the only way to touch vault at all.
--
-- ⚠️ THE GRANTS BELOW ARE THE SECURITY BOUNDARY, NOT THE RLS ABOVE.
-- A SECURITY DEFINER function is executable by PUBLIC by default. Left that
-- way, any logged-in admin could call advisor_key_read(<someone else's uuid>)
-- and read their colleague's key, straight past the table's RLS. The revoke +
-- grant pair is what actually prevents that: only service_role may call them,
-- and our server passes the *session's own* user id, never a client-supplied
-- one.
-- ----------------------------------------------------------------------------

create or replace function public.advisor_key_save(p_user_id uuid, p_key text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret uuid;
begin
  select secret_id into v_secret
    from public.admin_advisor_keys
   where user_id = p_user_id;

  if v_secret is null then
    insert into public.admin_advisor_keys (user_id, secret_id)
    values (
      p_user_id,
      vault.create_secret(
        p_key,
        'advisor_key_' || p_user_id::text,
        'Anthropic API key for /admin/advisor'
      )
    );
  else
    -- Overwrite in place (blueprint: an admin may replace their own key).
    perform vault.update_secret(v_secret, p_key);
    update public.admin_advisor_keys
       set secret_id = v_secret
     where user_id = p_user_id;
  end if;
end $$;

create or replace function public.advisor_key_read(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret uuid;
  v_key text;
begin
  select secret_id into v_secret
    from public.admin_advisor_keys
   where user_id = p_user_id;

  if v_secret is null then
    return null;
  end if;

  select decrypted_secret into v_key
    from vault.decrypted_secrets
   where id = v_secret;

  return v_key;
end $$;

revoke all on function public.advisor_key_save(uuid, text) from public;
revoke all on function public.advisor_key_read(uuid) from public;
grant execute on function public.advisor_key_save(uuid, text) to service_role;
grant execute on function public.advisor_key_read(uuid) to service_role;
