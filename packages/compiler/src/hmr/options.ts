export interface HmrDependencyOverride {
  readonly moduleId: string;
  readonly optIn?: boolean;
  readonly optOut?: boolean;
}

export interface HmrAnalysisOptions {
  readonly dependencies?: readonly HmrDependencyOverride[];
}
