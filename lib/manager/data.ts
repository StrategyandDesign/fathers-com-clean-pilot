import { latestPracticeLight } from "@/lib/father/skill-use";
import {
  asSessionProgress,
  isSessionComplete,
  type Session,
  type SessionProgress,
  type Training,
} from "@/lib/father/types";

export const DESK_TRAINING_COLUMNS =
  "id, slug, title, session_count, order_index, published, released_at, first_published_at, first_released_at";
export const DESK_SESSION_COLUMNS =
  "id, training_id, session_number, title, order_index";
export const DESK_PROGRESS_COLUMNS =
  "id, father_id, session_id, film_completed, checkin_completed, action_completed, status, completed_at, film_seconds, skill_use, skill_use_at";
export const DESK_DRAFT_COLUMNS = "father_id";
export const DESK_CERTIFICATE_COLUMNS =
  "id, father_id, training_id, serial_number, issued_at, issued_by";
export const DESK_ASSIGNMENT_COLUMNS =
  "id, father_id, training_id, assigned_at, assigned_by";

export type LoadManagerWorkspaceOptions = {
  signAvatars?: boolean;
};

function asDeskTraining(
  row: Partial<Training> &
    Pick<Training, "id" | "slug" | "title" | "session_count" | "order_index">
): Training {
  return {
    description: null,
    ...row,
  };
}

function asDeskSession(
  row: Partial<Session> &
    Pick<Session, "id" | "training_id" | "session_number" | "title" | "order_index">
): Session {
  return {
    keyline: null,
    video_url: null,
    ...row,
  };
}
import { rosterPracticeLight } from "@/lib/flags";
import { hidePilotTestTraining } from "@/lib/pilot/hygiene";
import { loadOrganizationReviews } from "@/lib/manager/reviews";
import { loadGroupsForManager } from "@/lib/org-staff/membership";
import { createClient } from "@/lib/supabase/server";
import { AVATARS_BUCKET, signStorageUrls } from "@/lib/storage";
import {
  displayName,
  latestTimestamp,
  profileName,
  type AttentionItem,
  type Certificate,
  type Group,
  type GroupMember,
  type ManagedProfile,
  type ParticipantRow,
  type ProfileDraftRow,
  type ProfileResult,
  type TrainingAssignment,
  type TrainingProgress,
} from "@/lib/manager/types";

function asProgress(row: SessionProgress): SessionProgress {
  return asSessionProgress(row);
}

function emptyIn<T>(
  ids: string[],
  load: () => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
) {
  if (ids.length === 0) {
    return Promise.resolve({ data: [] as T[], error: null });
  }
  return load();
}

export async function loadManagerGroups(managerId: string) {
  return loadGroupsForManager(managerId);
}

export async function loadManagerWorkspace(
  managerId: string,
  options: LoadManagerWorkspaceOptions = {}
) {
  const signAvatars = options.signAvatars !== false;
  const supabase = await createClient();
  const groups = await loadManagerGroups(managerId);
  const groupIds = groups.map((group) => group.id);

  const membersRes = await emptyIn<GroupMember>(groupIds, () =>
    supabase.from("group_members").select("group_id, father_id, joined_at").in("group_id", groupIds)
  );
  if (membersRes.error) throw membersRes.error;
  const members = (membersRes.data ?? []) as GroupMember[];
  const fatherIds = [...new Set(members.map((member) => member.father_id))];

  const [profilesRes, resultsRes, draftsRes, progressRes, assignmentsRes, certificatesRes, trainingsRes, sessionsRes, reviews] =
    await Promise.all([
      emptyIn<ManagedProfile>(fatherIds, () =>
        supabase.from("profiles").select("id, full_name, avatar_url").in("id", fatherIds)
      ),
      emptyIn<ProfileResult>(fatherIds, () =>
        supabase
          .from("father_profiles")
          .select("father_id, taken_at, primary_edge, primary_determination")
          .in("father_id", fatherIds)
          .order("taken_at", { ascending: false })
      ),
      emptyIn<Pick<ProfileDraftRow, "father_id">>(fatherIds, () =>
        supabase
          .from("father_profile_drafts")
          .select(DESK_DRAFT_COLUMNS)
          .in("father_id", fatherIds)
      ),
      emptyIn<SessionProgress>(fatherIds, () =>
        supabase
          .from("session_progress")
          .select(DESK_PROGRESS_COLUMNS)
          .in("father_id", fatherIds) as PromiseLike<{
          data: SessionProgress[] | null;
          error: { message: string } | null;
        }>
      ),
      emptyIn<TrainingAssignment>(fatherIds, () =>
        supabase
          .from("training_assignments")
          .select(DESK_ASSIGNMENT_COLUMNS)
          .in("father_id", fatherIds) as PromiseLike<{
          data: TrainingAssignment[] | null;
          error: { message: string } | null;
        }>
      ),
      emptyIn<Certificate>(fatherIds, () =>
        supabase.from("certificates").select(DESK_CERTIFICATE_COLUMNS).in("father_id", fatherIds)
      ),
      supabase.from("trainings").select(DESK_TRAINING_COLUMNS).order("order_index"),
      supabase.from("sessions").select(DESK_SESSION_COLUMNS).order("order_index"),
      loadOrganizationReviews(groupIds),
    ]);

  for (const result of [profilesRes, resultsRes, draftsRes, progressRes, assignmentsRes, certificatesRes, trainingsRes, sessionsRes]) {
    if (result.error) throw result.error;
  }

  const sessions = ((sessionsRes.data ?? []) as Session[]).map(asDeskSession);
  const allTrainings = ((trainingsRes.data ?? []) as Training[]).map(asDeskTraining);
  const profileRows = (profilesRes.data ?? []) as ManagedProfile[];
  const profiles = new Map(profileRows.map((profile) => [profile.id, profile]));
  const avatarUrls = signAvatars
    ? await signStorageUrls(
        supabase,
        AVATARS_BUCKET,
        profileRows.map((profile) => profile.avatar_url)
      )
    : new Map<string, string>();
  const latestProfile = new Map<string, ProfileResult>();
  for (const row of (resultsRes.data ?? []) as ProfileResult[]) {
    if (!latestProfile.has(row.father_id)) {
      latestProfile.set(row.father_id, row);
    }
  }
  const drafts = new Set(((draftsRes.data ?? []) as ProfileDraftRow[]).map((row) => row.father_id));
  const progress = ((progressRes.data ?? []) as SessionProgress[]).map(asProgress);
  const assignments = (assignmentsRes.data ?? []) as TrainingAssignment[];
  const certificates = (certificatesRes.data ?? []) as Certificate[];
  const progressSessionIds = new Set(progress.map((row) => row.session_id));
  const progressTrainingIds = new Set(
    sessions
      .filter((session) => progressSessionIds.has(session.id))
      .map((session) => session.training_id)
  );
  const certificateTrainingIds = new Set(certificates.map((row) => row.training_id));
  const assignedTrainingIds = new Set(assignments.map((row) => row.training_id));
  const trainings = allTrainings.filter(
    (training) =>
      assignedTrainingIds.has(training.id) ||
      !hidePilotTestTraining(training, {
        hasProgress: progressTrainingIds.has(training.id),
        hasCertificate: certificateTrainingIds.has(training.id),
      })
  );
  const groupsById = new Map(groups.map((group) => [group.id, group]));

  const progressByFather = new Map<string, SessionProgress[]>();
  for (const row of progress) {
    const list = progressByFather.get(row.father_id) ?? [];
    list.push(row);
    progressByFather.set(row.father_id, list);
  }

  function trainingProgressFor(fatherId: string): TrainingProgress[] {
    const fatherProgress = new Map(
      (progressByFather.get(fatherId) ?? []).map((row) => [row.session_id, row])
    );
    const assignedIds = new Set(
      assignments.filter((row) => row.father_id === fatherId).map((row) => row.training_id)
    );

    return trainings.map((training) => {
      const trainingSessions = sessions
        .filter((session) => session.training_id === training.id)
        .sort((a, b) => a.order_index - b.order_index);
      const completed = trainingSessions.filter((session) =>
        isSessionComplete(fatherProgress.get(session.id) ?? null)
      ).length;
      const currentSession = trainingSessions.find(
        (session) => !isSessionComplete(fatherProgress.get(session.id) ?? null)
      );
      const practiceLight = rosterPracticeLight()
        ? latestPracticeLight(
            trainingSessions
              .map((session) => fatherProgress.get(session.id))
              .filter((row): row is SessionProgress => Boolean(row))
          )
        : null;

      return {
        training,
        sessions: trainingSessions,
        completed,
        total: trainingSessions.length,
        assigned: assignedIds.has(training.id),
        gated: false,
        practiceLight,
        certificate:
          certificates.find(
            (row) => row.father_id === fatherId && row.training_id === training.id
          ) ?? null,
        current: currentSession
          ? {
              session: currentSession,
              progress: fatherProgress.get(currentSession.id) ?? null,
            }
          : null,
      };
    });
  }

  function profileStatus(fatherId: string): ParticipantRow["profileStatus"] {
    if (latestProfile.has(fatherId)) return "completed";
    if (drafts.has(fatherId)) return "in_progress";
    return "not_started";
  }

  function progressLabel(fatherId: string) {
    const cards = trainingProgressFor(fatherId);
    const active =
      cards.find((card) => card.assigned && !card.gated && card.completed < card.total) ??
      cards.find((card) => !card.gated && card.completed > 0 && card.completed < card.total) ??
      cards.find((card) => card.assigned && !card.gated) ??
      cards.find((card) => card.assigned) ??
      cards[0];

    if (!active) return "None assigned";
    if (active.completed === active.total && active.total > 0) {
      return `${active.training.title} complete`;
    }
    return `${active.training.title} · ${active.completed}/${active.total}`;
  }

  function sessionLights(fatherId: string) {
    const cards = trainingProgressFor(fatherId);
    const active =
      cards.find((card) => card.assigned && !card.gated && card.completed < card.total) ??
      cards.find((card) => !card.gated && card.completed > 0 && card.completed < card.total) ??
      cards.find((card) => card.assigned && !card.gated) ??
      cards.find((card) => card.assigned) ??
      cards[0];
    const current = active?.current?.progress ?? null;
    return {
      filmDone: current?.film_completed ?? false,
      checkpointDone: current?.checkin_completed ?? false,
      practiceLight: rosterPracticeLight()
        ? latestPracticeLight(progressByFather.get(fatherId) ?? [])
        : null,
    };
  }

  const participants: ParticipantRow[] = members.map((member) => {
    const fatherId = member.father_id;
    const fatherProgress = progressByFather.get(fatherId) ?? [];
    const fatherAssignments = assignments.filter((row) => row.father_id === fatherId);
    const fatherCertificates = certificates.filter((row) => row.father_id === fatherId);
    const profile = latestProfile.get(fatherId) ?? null;
    const managed = profiles.get(fatherId) ?? null;

    return {
      fatherId,
      name: displayName(managed, fatherId),
      avatarUrl: managed?.avatar_url ? avatarUrls.get(managed.avatar_url) ?? null : null,
      groupId: member.group_id,
      groupName: groupsById.get(member.group_id)?.name ?? "Group",
      joinedAt: member.joined_at,
      profileStatus: profileStatus(fatherId),
      profile,
      progressLabel: progressLabel(fatherId),
      ...sessionLights(fatherId),
      lastActivity: latestTimestamp([
        member.joined_at,
        profile?.taken_at,
        ...fatherProgress.map((row) => row.completed_at),
        ...fatherAssignments.map((row) => row.assigned_at),
        ...fatherCertificates.map((row) => row.issued_at),
      ]),
    };
  });

  participants.sort((a, b) => a.name.localeCompare(b.name));

  const sessionsCompleted = progress.filter((row) => isSessionComplete(row)).length;
  const trainingsCompleted = fatherIds.reduce((count, fatherId) => {
    return (
      count +
      trainingProgressFor(fatherId).filter((card) => card.total > 0 && card.completed === card.total)
        .length
    );
  }, 0);

  const needsAttention: AttentionItem[] = [];
  for (const participant of participants) {
    const cards = trainingProgressFor(participant.fatherId);
    if (!cards.some((card) => card.assigned)) {
      needsAttention.push({
        fatherId: participant.fatherId,
        name: participant.name,
        reason: "No training assigned",
      });
    }

    const current = cards.find((card) => card.current && card.current.progress)?.current;
    if (current?.progress && !isSessionComplete(current.progress)) {
      needsAttention.push({
        fatherId: participant.fatherId,
        name: participant.name,
        reason: `Session in progress: ${current.session.title}`,
      });
    }

    for (const card of cards) {
      if (card.total > 0 && card.completed === card.total && !card.certificate) {
        needsAttention.push({
          fatherId: participant.fatherId,
          name: participant.name,
          reason: `Ready for certificate: ${card.training.title}`,
        });
      }
    }
  }

  return {
    groups,
    trainings,
    sessions,
    reviews,
    participants,
    progress,
    certificates,
    assignments,
    trainingProgressFor,
    summary: {
      activeParticipants: fatherIds.length,
      profilesCompleted: latestProfile.size,
      sessionsCompleted,
      trainingsCompleted,
      pendingActions: needsAttention.length,
    },
    needsAttention: needsAttention.slice(0, 8),
  };
}

export async function loadManagedParticipant(managerId: string, fatherId: string) {
  const workspace = await loadManagerWorkspace(managerId);
  const participant = workspace.participants.find((row) => row.fatherId === fatherId);
  if (!participant) return null;

  return {
    participant,
    trainings: workspace.trainings,
    progress: workspace.trainingProgressFor(fatherId),
    groups: workspace.groups,
    reviews: workspace.reviews,
  };
}

export async function loadCertificatePreview(
  managerId: string,
  fatherId: string,
  trainingId: string
) {
  const detail = await loadManagedParticipant(managerId, fatherId);
  if (!detail) return null;

  const card = detail.progress.find((row) => row.training.id === trainingId);
  if (!card) return null;

  const supabase = await createClient();
  const { data: manager, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", managerId)
    .maybeSingle();

  if (error) throw error;

  return {
    participant: detail.participant,
    training: card.training,
    certificate: card.certificate,
    complete: card.total > 0 && card.completed === card.total,
    managerName: profileName(manager, "Leader"),
  };
}
