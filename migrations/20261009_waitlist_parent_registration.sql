BEGIN;
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS privacy_notice_version text,
  ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_consent_version text,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS launch_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS parent_permission_at timestamptz,
  ADD COLUMN IF NOT EXISTS parent_permission_version text,
  ADD COLUMN IF NOT EXISTS registration_actor text;

-- Supersedes the unmerged PR's constraints if applied to a preview branch.
-- Existing records remain untouched; no consent or age is inferred/backfilled.
ALTER TABLE public.waitlist
  DROP CONSTRAINT IF EXISTS waitlist_new_age_eligible,
  DROP CONSTRAINT IF EXISTS waitlist_new_marketing_consent,
  DROP CONSTRAINT IF EXISTS waitlist_current_age,
  DROP CONSTRAINT IF EXISTS waitlist_parent_registration;
ALTER TABLE public.waitlist ADD CONSTRAINT waitlist_current_age
  CHECK (privacy_notice_version IS DISTINCT FROM '2026-10-09' OR
    (age_group IS NOT NULL AND age_group IN ('<13', '13-18', '19-20', '20+')));
ALTER TABLE public.waitlist ADD CONSTRAINT waitlist_parent_registration
  CHECK (privacy_notice_version IS DISTINCT FROM '2026-10-09' OR
    (registration_actor IS NOT NULL AND registration_actor IN ('self', 'parent') AND
     (age_group <> '<13' OR (registration_actor = 'parent' AND parent_permission_at IS NOT NULL AND
       parent_permission_version IS NOT NULL AND parent_permission_version = privacy_notice_version))));

CREATE TABLE IF NOT EXISTS public.waitlist_parent_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_email text NOT NULL UNIQUE,
  age_group text NOT NULL CHECK (age_group = '<13'),
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS waitlist_parent_requests_expiry ON public.waitlist_parent_requests(expires_at);

CREATE OR REPLACE FUNCTION public.enforce_waitlist_age_eligibility() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN
  IF NEW.age_group IS NULL OR NEW.age_group NOT IN ('<13', '13-18', '19-20', '20+') THEN
    RAISE EXCEPTION 'A current age group is required' USING ERRCODE = '23514';
  END IF;
  IF NEW.age_group = '<13' AND (NEW.registration_actor IS DISTINCT FROM 'parent' OR NEW.parent_permission_at IS NULL
    OR NEW.parent_permission_version IS NULL) THEN
    RAISE EXCEPTION 'Parent registration is required for this age group' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.enforce_form_age_eligibility() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN
  IF COALESCE(NEW.respondent_info->>'age_group', '') NOT IN ('<13', '13-18', '19-20', '20+') THEN
    RAISE EXCEPTION 'A current age group is required' USING ERRCODE = '23514';
  END IF;
  IF NEW.respondent_info->>'age_group' = '<13' AND NEW.respondent_info->>'registration_actor' IS DISTINCT FROM 'parent' THEN
    RAISE EXCEPTION 'An adult must complete this questionnaire with their own information' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.waitlist'::regclass AND tgname = 'waitlist_insert_age_gate') THEN
    CREATE TRIGGER waitlist_insert_age_gate BEFORE INSERT ON public.waitlist
      FOR EACH ROW EXECUTE FUNCTION public.enforce_waitlist_age_eligibility();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.enemites_form_submissions'::regclass AND tgname = 'form_insert_age_gate') THEN
    CREATE TRIGGER form_insert_age_gate BEFORE INSERT ON public.enemites_form_submissions
      FOR EACH ROW EXECUTE FUNCTION public.enforce_form_age_eligibility();
  END IF;
END $$;
COMMIT;
