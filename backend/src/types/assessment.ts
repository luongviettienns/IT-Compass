export type HollandGroup = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export type AssessmentResultCode =
  | 'SE'
  | 'Data'
  | 'Cybersecurity'
  | 'UXUI'
  | 'QLDA'
  | 'DevOps'
  | 'Fallback';

export type AssessmentConfidence = 'high' | 'medium' | 'low';

export type HollandScores = Record<HollandGroup, number>;

export interface HollandQuestion {
  id: string;
  text: string;
  group: HollandGroup;
}

export interface SituationalOption {
  id: string;
  text: string;
  bonus: Partial<HollandScores>;
  specialAction?: Exclude<AssessmentResultCode, 'Fallback'>;
}

export interface SituationalQuestion {
  id: string;
  context: string;
  text: string;
  options: SituationalOption[];
}

export interface AssessmentResultProfile {
  title: string;
  headline: string;
  description: string;
  matchedCareers: string[];
  majorSlugs: string[];
  mentorExpertise: string[];
}

export interface MajorRankingItem {
  resultCode: Exclude<AssessmentResultCode, 'Fallback'>;
  title: string;
  headline: string;
  affinityScore: number;
  primaryTraits: HollandGroup[];
  matchedCareers: string[];
  suggestedMajors: string[];
  matchPercent: number;
  confidence: AssessmentConfidence;
}

export interface HollandBreakdownItem {
  code: HollandGroup;
  score: number;
  percent: number;
  rank: number;
}

export interface ScoringMeta {
  dominantCode: string;
  spreadFromTop1ToTop3: number;
  fallbackTriggered: boolean;
  specialActions: string[];
}

export interface ScoredGroup {
  group: HollandGroup;
  score: number;
}

export interface SerializedHollandAnswer {
  questionId: string;
  group: HollandGroup;
  value: number;
}

export interface SerializedSituationalAnswer {
  questionId: string;
  optionId: string;
  specialAction: string | null;
  bonus: Partial<HollandScores>;
}

export interface AssessmentSummary {
  title: string;
  headline: string;
  description: string;
  matchedCareers: string[];
  suggestedMajors: string[];
  suggestedMentorExpertise: string[];
  topTraits: HollandGroup[];
  ranking: MajorRankingItem[];
  hollandBreakdown: HollandBreakdownItem[];
  scoringMeta: ScoringMeta;
}

export interface AssessmentAnalysis {
  resultCode: AssessmentResultCode;
  totalScores: HollandScores;
  sortedScores: ScoredGroup[];
  ranking: MajorRankingItem[];
  hollandBreakdown: HollandBreakdownItem[];
  scoringMeta: ScoringMeta;
}

export interface NormalizedAssessmentAttempt {
  id: string;
  quizType: string;
  quizVersion: string;
  status: string;
  resultCode: string | null;
  topTraits: unknown;
  rawScores: unknown;
  answers: unknown;
  summary: unknown;
  startedAt: Date | null;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
