export type DependencyHmrReason = "imported" | "route-companion" | "explicit-opt-in";

export interface DependencyHmrInput {
  readonly routeModuleId: string;
  readonly dependencies: readonly DependencyHmrCandidate[];
}

export interface DependencyHmrCandidate {
  readonly moduleId: string;
  readonly sourceText: string;
  readonly reason: DependencyHmrReason;
  readonly optIn?: boolean;
  readonly optOut?: boolean;
}

export interface DependencyHmrResult {
  readonly routeModuleId: string;
  readonly participants: readonly DependencyHmrParticipant[];
  readonly rejected: readonly DependencyHmrRejected[];
}

export interface DependencyHmrParticipant {
  readonly moduleId: string;
  readonly reason: DependencyHmrReason;
  readonly serviceIds: readonly string[];
  readonly fingerprint: string;
}

export interface DependencyHmrRejected {
  readonly moduleId: string;
  readonly reason: "anonymous-refsubject-state" | "explicit-opt-out";
}

const refSubjectServicePattern = /RefSubject\.Service(?:<[^>]*>)?\(\)\("([^"]+)"\)/g;
const anonymousRefSubjectPattern = /RefSubject\.make\(/;

export function analyzeDependencyHmr(input: DependencyHmrInput): DependencyHmrResult {
  const participants: DependencyHmrParticipant[] = [];
  const rejected: DependencyHmrRejected[] = [];

  for (const dependency of input.dependencies) {
    if (dependency.optOut) {
      rejected.push({ moduleId: dependency.moduleId, reason: "explicit-opt-out" });
      continue;
    }

    const serviceIds = findRefSubjectServiceIds(dependency.sourceText);
    if (serviceIds.length > 0 || dependency.optIn) {
      participants.push(participant(dependency, serviceIds));
    } else if (anonymousRefSubjectPattern.test(dependency.sourceText)) {
      rejected.push({ moduleId: dependency.moduleId, reason: "anonymous-refsubject-state" });
    }
  }

  return { routeModuleId: input.routeModuleId, participants, rejected };
}

function participant(
  dependency: DependencyHmrCandidate,
  serviceIds: readonly string[],
): DependencyHmrParticipant {
  return {
    moduleId: dependency.moduleId,
    reason: dependency.reason,
    serviceIds,
    fingerprint: dependencyFingerprint(dependency.moduleId, serviceIds, dependency.reason),
  };
}

function findRefSubjectServiceIds(sourceText: string): readonly string[] {
  return [...sourceText.matchAll(refSubjectServicePattern)].map((match) => match[1]);
}

function dependencyFingerprint(
  moduleId: string,
  serviceIds: readonly string[],
  reason: DependencyHmrReason,
): string {
  const stableIds = serviceIds.length > 0 ? [...serviceIds].sort().join(",") : reason;
  return `${moduleId}:${stableIds}`;
}
