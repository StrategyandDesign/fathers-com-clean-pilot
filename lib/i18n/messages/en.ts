import { enFatherRest } from "@/lib/i18n/messages/en-father-rest";
import { enManager } from "@/lib/i18n/messages/en-manager";
import { enReviewer, enHelp } from "@/lib/i18n/messages/en-tail";
import { enHead } from "@/lib/i18n/messages/en-head";

export const en = {
  ...enHead,
  father: {
    ...enHead.father,
    ...enFatherRest,
  },
  manager: enManager,
  reviewer: enReviewer,
  help: enHelp,
} as const;
