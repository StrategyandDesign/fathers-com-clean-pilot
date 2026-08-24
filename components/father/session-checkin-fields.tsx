import { SkillPromptField } from "@/components/father/skill-prompt";
import {
  CHECKIN_NOTE_KEY,
  CHECKIN_NOTE_MAX_LENGTH,
  type CheckinQuestion,
} from "@/lib/father/session-questions";
import { textareaClassName } from "@/lib/ui";

export function SessionCheckinFields({
  questions,
  answers,
  invalid,
  autoAdvance,
  note,
  questionOf,
}: {
  questions: CheckinQuestion[];
  answers?: Record<string, string>;
  invalid?: boolean;
  autoAdvance: boolean;
  note?: {
    label: string;
    placeholder: string;
    defaultValue?: string | null;
  };
  questionOf?: (index: number, total: number) => string;
}) {
  const allowAutoAdvance = autoAdvance && !note;

  return (
    <>
      {questions.map((question, index) => (
        <div key={question.key} className="space-y-2">
          {questionOf ? (
            <p className="text-sm text-muted-foreground">
              {questionOf(index + 1, questions.length)}
            </p>
          ) : null}
          <SkillPromptField
            name={question.key}
            prompt={question.label}
            defaultValue={answers?.[question.key]}
            invalid={invalid}
            autoAdvance={allowAutoAdvance}
          />
        </div>
      ))}
      {note ? (
        <label className="block space-y-2">
          <span className="text-sm text-muted-foreground">{note.label}</span>
          <textarea
            className={textareaClassName}
            name={CHECKIN_NOTE_KEY}
            maxLength={CHECKIN_NOTE_MAX_LENGTH}
            placeholder={note.placeholder}
            defaultValue={note.defaultValue ?? ""}
          />
        </label>
      ) : null}
    </>
  );
}
