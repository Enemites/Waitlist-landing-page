-- Isolated preview branch only. Synthetic fixtures roll back automatically.
DO $$
DECLARE
  initial_count bigint;
  recipient uuid := gen_random_uuid();
  fixture_email text := gen_random_uuid()::text || '@example.invalid';
  launch_count bigint;
  updates_count bigint;
BEGIN
  SELECT count(*) INTO initial_count FROM public.waitlist;
  BEGIN
    INSERT INTO public.waitlist(id,name,email,age_group,receive_updates,privacy_notice_version,launch_requested_at,registration_actor)
      VALUES(recipient,'Synthetic Adult',fixture_email,'13-18',false,'2026-10-09',now(),'self');
    SELECT count(*) INTO launch_count FROM public.waitlist
      WHERE id=recipient AND unsubscribed_at IS NULL
        AND (launch_requested_at IS NOT NULL OR privacy_notice_version IS NULL);
    SELECT count(*) INTO updates_count FROM public.waitlist
      WHERE id=recipient AND unsubscribed_at IS NULL AND receive_updates IS TRUE;
    IF launch_count <> 1 OR updates_count <> 0 THEN RAISE EXCEPTION 'Launch/update preference separation failed'; END IF;
    UPDATE public.waitlist SET receive_updates=false,unsubscribed_at=COALESCE(unsubscribed_at,now())
      WHERE id=recipient AND encode(sha256(convert_to(lower(trim(email)), 'UTF8')), 'hex')=
        encode(sha256(convert_to(lower(trim(fixture_email)), 'UTF8')), 'hex');
    IF EXISTS (SELECT 1 FROM public.waitlist WHERE id=recipient AND unsubscribed_at IS NULL) THEN
      RAISE EXCEPTION 'Unsubscribe suppression failed';
    END IF;
    BEGIN
      INSERT INTO public.waitlist(name,email,age_group,privacy_notice_version,registration_actor)
        VALUES('Synthetic Child','child@example.invalid','<13','2026-10-09','self');
      RAISE EXCEPTION 'Direct child registration was accepted';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    INSERT INTO public.waitlist(name,email,age_group,privacy_notice_version,registration_actor,parent_permission_at,parent_permission_version,launch_requested_at)
      VALUES('Synthetic Parent','parent-'||fixture_email,'<13','2026-10-09','parent',now(),'2026-10-09',now());
    BEGIN
      INSERT INTO public.waitlist(name,email,age_group) VALUES('Synthetic Ambiguous','ambiguous@example.invalid','10-18');
      RAISE EXCEPTION 'Ambiguous new age was accepted';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    INSERT INTO public.waitlist_parent_requests(parent_email,age_group,token_hash,expires_at)
      VALUES('pending-'||fixture_email,'<13',encode(sha256(convert_to(fixture_email,'UTF8')),'hex'),now()-INTERVAL '1 day');
    DELETE FROM public.waitlist_parent_requests WHERE expires_at<=NOW() AND parent_email='pending-'||fixture_email;
    IF EXISTS (SELECT 1 FROM public.waitlist_parent_requests WHERE parent_email='pending-'||fixture_email) THEN
      RAISE EXCEPTION 'Expired invitation cleanup failed';
    END IF;
    INSERT INTO public.enemites_forms(id,title,slug,questions,is_active)
      VALUES(recipient,'Synthetic survey',recipient::text,'[]',true);
    INSERT INTO public.enemites_form_submissions(form_id,form_slug,responses,respondent_info)
      VALUES(recipient,recipient::text,'{}','{"age_group":"<13","registration_actor":"parent"}');
    BEGIN
      INSERT INTO public.enemites_form_submissions(form_id,form_slug,responses,respondent_info)
        VALUES(recipient,recipient::text,'{}','{"age_group":"<13","registration_actor":"self"}');
      RAISE EXCEPTION 'Direct child questionnaire was accepted';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    INSERT INTO public.waitlist(name,email,age_group,receive_updates)
      VALUES('Synthetic Legacy','legacy-'||fixture_email,'20+',true);
    IF NOT EXISTS (SELECT 1 FROM public.waitlist WHERE email='legacy-'||fixture_email AND receive_updates IS TRUE
      AND privacy_notice_version IS NULL AND unsubscribed_at IS NULL) THEN
      RAISE EXCEPTION 'Legacy update preference was discarded';
    END IF;
    RAISE EXCEPTION 'Fixture rollback' USING ERRCODE='ZX001';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
  END;
  IF (SELECT count(*) FROM public.waitlist) <> initial_count THEN RAISE EXCEPTION 'Fixtures remained'; END IF;
END $$;
