-- Enable Supabase Realtime for the dashboard tables.
--
-- Supabase Realtime delivers postgres_changes events only for tables
-- that are members of the `supabase_realtime` publication. Without this,
-- the channel subscribes successfully but never receives UPDATE/INSERT
-- payloads — which is why the dashboard would silently fall back to
-- polling.
--
-- This script is idempotent: it safely creates the publication if it
-- doesn't exist and only adds each table when it isn't already a member.
-- Re-running it has no effect.
--
-- Tables enabled:
--   public.profiles      -> live wallet_balance, admin flag, profile fields
--   public.transactions  -> live transaction list (insert / update / delete)
--
-- REPLICA IDENTITY FULL is also set so UPDATE payloads include the full
-- previous row, which Supabase Realtime needs to compute change events
-- reliably (especially for filtered subscriptions).

-- 1. Make sure the publication exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- 2. Add `profiles` to the publication if not already a member.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'profiles'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles';
  END IF;
END
$$;

-- 3. Add `transactions` to the publication if not already a member.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'transactions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions';
  END IF;
END
$$;

-- 4. Ensure full row data is captured for updates (needed for filtered
--    realtime subscriptions to work reliably).
ALTER TABLE public.profiles      REPLICA IDENTITY FULL;
ALTER TABLE public.transactions  REPLICA IDENTITY FULL;

-- 5. Verification (visible in script output).
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN ('profiles', 'transactions')
ORDER BY tablename;
