-- Replace Micah's previous hold placeholder with the Ken+Micah overview/preview hold.
-- Only updates trainings.overview_video_url and session film URLs that still use the old hold.
-- Restricts trainings to the old hold URL or an empty overview_video_url so existing films stay.
-- Does not change published, released_at, development_status, copy, or session titles/prompts.
-- Idempotent: re-run is a no-op once URLs already match the new hold.
-- Keep these rows unpublished. Do not call release RPCs.

update public.trainings
set overview_video_url = 'https://www.youtube.com/watch?v=aVO0k0a9Fc4'
where
  overview_video_url = 'https://www.youtube.com/watch?v=yo_nS0vpV4M'
  or coalesce(nullif(btrim(overview_video_url), ''), '') = '';

update public.sessions
set video_url = 'https://www.youtube.com/watch?v=aVO0k0a9Fc4'
where video_url = 'https://www.youtube.com/watch?v=yo_nS0vpV4M';
