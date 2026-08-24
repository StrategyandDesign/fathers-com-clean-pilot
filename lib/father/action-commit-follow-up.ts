export async function runActionMomentFollowUp(input: {
  queueReminder?: () => Promise<unknown>;
  saveTimezone?: () => Promise<unknown>;
}) {
  if (input.queueReminder) {
    try {
      await input.queueReminder();
    } catch (error) {
      console.error("[notifications] action reminder enqueue failed", error);
    }
  }

  if (input.saveTimezone) {
    try {
      await input.saveTimezone();
    } catch (error) {
      console.error("[notifications] timezone save failed", error);
    }
  }
}

export function scheduleActionMomentFollowUp(
  work: () => Promise<void>,
  schedule: (task: () => void) => void
) {
  schedule(() => {
    void Promise.resolve()
      .then(work)
      .catch((error) => {
        console.error("[notifications] action moment follow-up failed", error);
      });
  });
}

export function finishActionMomentAfterSave(input: {
  followUp: () => Promise<void>;
  schedule: (task: () => void) => void;
  redirect: () => void;
}) {
  scheduleActionMomentFollowUp(input.followUp, input.schedule);
  input.redirect();
}
