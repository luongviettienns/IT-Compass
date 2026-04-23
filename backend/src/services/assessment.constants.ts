import type { AssessmentResultCode, HollandGroup, HollandScores } from '../types/assessment.js';
import { hollandQuestionsCatalog, situationalQuestionsCatalog } from './assessment.questions.js';

export const HOLLAND_GROUPS: HollandGroup[] = ['R', 'I', 'A', 'S', 'E', 'C'];

export const HOLLAND_QUESTION_IDS = hollandQuestionsCatalog.map((question) => question.id);

export const SITUATIONAL_OPTION_IDS = Object.fromEntries(
  situationalQuestionsCatalog.map((question) => [
    question.id,
    question.options.map((option) => option.id),
  ]),
) as Record<string, string[]>;

export const QUIZ_SCORING_THRESHOLDS = {
  fallbackTopScore: 12,
  fallbackSpread: 2,
} as const;

export const RESULT_CODE_BY_PAIR: Record<string, Exclude<AssessmentResultCode, 'Fallback'>> = {
  CI: 'SE',
  IR: 'Cybersecurity',
  AS: 'UXUI',
  AI: 'UXUI',
  CE: 'QLDA',
  ES: 'QLDA',
  CR: 'DevOps',
};

export const RESULT_AFFINITY_WEIGHTS: Record<Exclude<AssessmentResultCode, 'Fallback'>, HollandScores> = {
  SE: { R: 0.45, I: 0.95, A: 0.1, S: 0.1, E: 0.1, C: 1 },
  Data: { R: 0.15, I: 1, A: 0.25, S: 0.05, E: 0.05, C: 0.85 },
  Cybersecurity: { R: 0.9, I: 0.95, A: 0.05, S: 0.05, E: 0.1, C: 0.35 },
  UXUI: { R: 0.05, I: 0.35, A: 1, S: 0.85, E: 0.2, C: 0.05 },
  QLDA: { R: 0.05, I: 0.15, A: 0.05, S: 0.6, E: 1, C: 0.85 },
  DevOps: { R: 0.85, I: 0.45, A: 0.05, S: 0.05, E: 0.1, C: 1 },
};

export const RESULT_MATCH_PERCENT = {
  base: 55,
  range: 45,
} as const;

export const SPECIAL_ACTION_MATCH_BONUS = 0.12;
