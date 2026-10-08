-- Run only on an isolated validation branch. All synthetic rows roll back.
DO $$
DECLARE
  initial_count bigint;
  recipient uuid := gen_random_uuid();
  eligible_count bigint;
  token_email_hash text;
  fixture_email text := gen_random_uuid()::text || '@example.invalid';
BEGIN
  SELECT count(*) INTO initial_count FROM public.waitlist;
  BEGIN
    INSERT INTO public.waitlist(id,name,email,age_group,receive_updates,privacy_notice_version,marketing_consent_at,marketing_consent_version)
      VALUES(recipient,'Synthetic Test',fixture_email,'13-17',true,'2026-10-08',now(),'2026-10-08');
    SELECT count(*) INTO eligible_count FROM public.waitlist
      WHERE id=recipient AND receive_updates IS TRUE AND unsubscribed_at IS NULL
      AND marketing_consent_at IS NOT NULL AND marketing_consent_version='2026-10-08'
      AND privacy_notice_version='2026-10-08' AND age_group IN ('13-17','18-20','20+');
    IF eligible_count <> 1 THEN RAISE EXCEPTION 'Eligible recipient unavailable'; END IF;
    token_email_hash := encode(sha256(convert_to(lower(trim(fixture_email)), 'UTF8')), 'hex');
    UPDATE public.waitlist SET receive_updates=false,unsubscribed_at=COALESCE(unsubscribed_at,now())
      WHERE id=recipient AND encode(sha256(convert_to(lower(trim(email)), 'UTF8')), 'hex')=token_email_hash;
    UPDATE public.waitlist SET receive_updates=false,unsubscribed_at=COALESCE(unsubscribed_at,now())
      WHERE id=recipient AND encode(sha256(convert_to(lower(trim(email)), 'UTF8')), 'hex')=token_email_hash;
    IF EXISTS (SELECT 1 FROM public.waitlist WHERE id=recipient AND (receive_updates IS TRUE OR unsubscribed_at IS NULL)) THEN
      RAISE EXCEPTION 'Unsubscribe suppression failed';
    END IF;
    BEGIN
      INSERT INTO public.waitlist(name,email,age_group) VALUES('Synthetic Underage','child@example.invalid','under-13');
      RAISE EXCEPTION 'Underage insert was accepted';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    BEGIN
      INSERT INTO public.waitlist(name,email,age_group) VALUES('Synthetic Ambiguous','ambiguous@example.invalid','10-18');
      RAISE EXCEPTION 'Ambiguous age insert was accepted';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    BEGIN
      INSERT INTO public.waitlist(name,email,age_group,receive_updates,privacy_notice_version)
        VALUES('Synthetic No Consent Evidence','consent@example.invalid','18-20',true,'2026-10-08');
      RAISE EXCEPTION 'Consent without evidence was accepted';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    BEGIN
      INSERT INTO public.enemites_form_submissions(form_id,form_slug,responses,respondent_info)
        VALUES(gen_random_uuid(),'synthetic-test','{}','{"age_group":"under-13"}');
      RAISE EXCEPTION 'Underage questionnaire insert was accepted';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    -- Subtransaction rolls back fixtures, not the original rows.
    RAISE EXCEPTION 'Fixture rollback' USING ERRCODE='ZX001';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
  END;
  IF (SELECT count(*) FROM public.waitlist) <> initial_count THEN RAISE EXCEPTION 'Fixtures remained after test'; END IF;
END $$;
