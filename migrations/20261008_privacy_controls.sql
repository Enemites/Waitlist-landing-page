BEGIN;
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS privacy_notice_version text,
  ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_consent_version text,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;
-- Legacy age bands cannot establish eligibility or new consent. Do not backfill it.
-- Conditional checks retain legacy rows while enforcing new submissions.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.waitlist'::regclass AND conname = 'waitlist_new_age_eligible') THEN
    ALTER TABLE public.waitlist ADD CONSTRAINT waitlist_new_age_eligible
      CHECK (privacy_notice_version IS NULL OR age_group IN ('13-17', '18-20', '20+'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.waitlist'::regclass AND conname = 'waitlist_new_marketing_consent') THEN
    ALTER TABLE public.waitlist ADD CONSTRAINT waitlist_new_marketing_consent
      CHECK (privacy_notice_version IS NULL OR receive_updates IS NOT TRUE OR
        (marketing_consent_at IS NOT NULL AND marketing_consent_version IS NOT NULL AND unsubscribed_at IS NULL));
  END IF;
END $$;
-- Enforce the age rule on INSERT from any writer, without altering old records.
CREATE OR REPLACE FUNCTION public.enforce_waitlist_age_eligibility() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN
  IF NEW.age_group IS NULL OR NEW.age_group NOT IN ('13-17', '18-20', '20+') THEN
    RAISE EXCEPTION 'An eligible, unambiguous age group is required' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.enforce_form_age_eligibility() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN
  IF COALESCE(NEW.respondent_info->>'age_group', '') NOT IN ('13-17', '18-20', '20+') THEN
    RAISE EXCEPTION 'An eligible, unambiguous age group is required' USING ERRCODE = '23514';
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
