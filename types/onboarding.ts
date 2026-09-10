export type OnboardingData = {
  fullName: string;
  wilaya: string;
  educationDirectorate: string;
  phase: string;
  schoolName: string;
  schoolCommune: string;
  schoolYearLabel: string;
  schoolYearStart: string;
  schoolYearEnd: string;
  levelIds: string[];
  firstClassName: string;
  firstClassLevelId: string;
};

export const ONBOARDING_STEPS = [
  "name",
  "wilaya",
  "directorate",
  "school",
  "phase",
  "schoolYear",
  "levels",
  "firstClass",
] as const;

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number];
