export function scheduleSessionProgressFollowUp(
  work: () => void,
  schedule: (task: () => void) => void
) {
  schedule(() => {
    try {
      work();
    } catch (error) {
      console.error("[session] progress follow-up failed", error);
    }
  });
}

export function finishSessionProgressAfterSave(input: {
  followUp: () => void;
  schedule: (task: () => void) => void;
  redirect: () => void;
}) {
  scheduleSessionProgressFollowUp(input.followUp, input.schedule);
  input.redirect();
}
