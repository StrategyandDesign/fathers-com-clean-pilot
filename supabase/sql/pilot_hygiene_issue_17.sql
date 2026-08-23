-- Issue 17 pilot hygiene. Idempotent. Safe to re-run on the Pilot project.
-- Flag-off default: hide empty Test Training rows, dismiss the test desk
-- note, and rename the Hebrew language org away from a real military unit.
-- Re-run seed_unit_8200.sql after this if @il seats lose their organization.

-- Neutral display name for the Hebrew language seats (code IL).
update public.groups
set name = 'Hebrew Pilot Group'
where code = 'IL'
   or name = 'Unit 8200';

-- Unpublish empty test trainings so they leave father-visible shelves.
update public.trainings
set published = false,
    development_status = 'draft'
where (
    title ~* '^test(\s+training)?(\s+\d+)?$'
    or coalesce(working_title, '') ~* '^test(\s+training)?(\s+\d+)?$'
  )
  and coalesce(session_count, 0) = 0;

-- Dismiss the Super-admin test ping from Leader and Reviewer desks.
update public.platform_staff_message_recipients as recipients
set dismissed_at = coalesce(recipients.dismissed_at, now())
from public.platform_staff_messages as messages
where recipients.message_id = messages.id
  and (
    messages.body ~* 'did you receive'
    or messages.body ~* '^test!'
  );
