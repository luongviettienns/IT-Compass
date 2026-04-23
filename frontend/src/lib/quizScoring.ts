import type {
  AssessmentRankingItem,
  HollandBreakdownItem,
  AssessmentResultCode,
  AssessmentTemplate,
} from './assessmentApi';

export type HollandGroup = HollandBreakdownItem['code'];

export type MajorResult = AssessmentResultCode;

export type QuizScores = Record<HollandGroup, number>;

export type SituationalAnswerForScoring = {
  bonus?: Partial<Record<HollandGroup, number>>;
  specialAction?: string;
};

export type ResultProfileLike = AssessmentTemplate['resultProfiles'][number];

export type QuizAnalysis = {
  resultCode: MajorResult;
  rawScores: QuizScores;
  topTraits: HollandGroup[];
  ranking: AssessmentRankingItem[];
  hollandBreakdown: HollandBreakdownItem[];
  scoringMeta: {
    dominantCode: string;
    spreadFromTop1ToTop3: number;
    fallbackTriggered: boolean;
    specialActions: string[];
  };
};

const HOLLAND_GROUPS: HollandGroup[] = ['R', 'I', 'A', 'S', 'E', 'C'];
const RESULT_CODE_BY_PAIR: Record<string, Exclude<MajorResult, 'Fallback'>> = {
  CI: 'SE',
  IR: 'Cybersecurity',
  AS: 'UXUI',
  AI: 'UXUI',
  CE: 'QLDA',
  ES: 'QLDA',
  CR: 'DevOps',
};
const RESULT_AFFINITY_WEIGHTS: Record<Exclude<MajorResult, 'Fallback'>, Record<HollandGroup, number>> = {
  SE: { R: 0.45, I: 0.95, A: 0.1, S: 0.1, E: 0.1, C: 1 },
  Data: { R: 0.15, I: 1, A: 0.25, S: 0.05, E: 0.05, C: 0.85 },
  Cybersecurity: { R: 0.9, I: 0.95, A: 0.05, S: 0.05, E: 0.1, C: 0.35 },
  UXUI: { R: 0.05, I: 0.35, A: 1, S: 0.85, E: 0.2, C: 0.05 },
  QLDA: { R: 0.05, I: 0.15, A: 0.05, S: 0.6, E: 1, C: 0.85 },
  DevOps: { R: 0.85, I: 0.45, A: 0.05, S: 0.05, E: 0.1, C: 1 },
};
const RESULT_MATCH_PERCENT = { base: 55, range: 45 };
const SPECIAL_ACTION_MATCH_BONUS = 0.12;
const DEFAULT_RESULT_CODE: Exclude<MajorResult, 'Fallback'> = 'SE';

const unique = (values: Array<string | undefined>) => [...new Set(values.filter(Boolean))] as string[];

const getPrimaryTraits = (resultCode: Exclude<MajorResult, 'Fallback'>): HollandGroup[] =>
  Object.entries(RESULT_AFFINITY_WEIGHTS[resultCode])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([group]) => group as HollandGroup);

const resolveResultCode = (
  top1: { group: HollandGroup; score: number },
  top2: { group: HollandGroup; score: number },
  top3: { group: HollandGroup; score: number },
  specialActions: string[],
): { resultCode: MajorResult; fallbackTriggered: boolean } => {
  const fallbackTriggered = top1.score < 12 || top1.score - top3.score <= 2;
  if (fallbackTriggered) {
    return { resultCode: 'Fallback', fallbackTriggered };
  }

  const code = [top1.group, top2.group].sort().join('');
  if (code === 'CI') {
    return { resultCode: specialActions.includes('Data') ? 'Data' : 'SE', fallbackTriggered };
  }

  if (RESULT_CODE_BY_PAIR[code]) {
    return { resultCode: RESULT_CODE_BY_PAIR[code], fallbackTriggered };
  }

  if (specialActions.includes('Data')) return { resultCode: 'Data', fallbackTriggered };
  if (specialActions.includes('UXUI')) return { resultCode: 'UXUI', fallbackTriggered };
  if (specialActions.includes('QLDA')) return { resultCode: 'QLDA', fallbackTriggered };
  return { resultCode: DEFAULT_RESULT_CODE, fallbackTriggered };
};

const buildHollandBreakdown = (rawScores: QuizScores): HollandBreakdownItem[] => {
  const sorted = Object.entries(rawScores)
    .map(([group, score]) => ({ group: group as HollandGroup, score }))
    .sort((a, b) => b.score - a.score);
  const topScore = Math.max(...Object.values(rawScores), 0);
  const rankMap = new Map(sorted.map((item, index) => [item.group, index + 1]));

  return HOLLAND_GROUPS.map((group) => ({
    code: group,
    score: rawScores[group],
    percent: topScore > 0 ? Math.round((rawScores[group] / topScore) * 100) : 0,
    rank: rankMap.get(group) || HOLLAND_GROUPS.length,
  }));
};

const getProfileMap = (resultProfiles: ResultProfileLike[]) =>
  new Map(resultProfiles.map((profile) => [profile.resultCode, profile] as const));

const toRankingItem = (
  profile: ResultProfileLike,
  affinityScore: number,
  topAffinityScore: number,
): AssessmentRankingItem => ({
  resultCode: profile.resultCode,
  title: profile.title,
  headline: profile.headline,
  affinityScore,
  primaryTraits: getPrimaryTraits(profile.resultCode as Exclude<MajorResult, 'Fallback'>),
  matchedCareers: profile.matchedCareers,
  suggestedMajors: profile.majorSlugs,
  matchPercent: Math.round(
    RESULT_MATCH_PERCENT.base + (affinityScore / topAffinityScore) * RESULT_MATCH_PERCENT.range,
  ),
  confidence:
    affinityScore / topAffinityScore >= 0.78
      ? 'high'
      : affinityScore / topAffinityScore >= 0.5
        ? 'medium'
        : 'low',
});

const buildRanking = (
  rawScores: QuizScores,
  specialActions: string[],
  resultProfiles: ResultProfileLike[],
): AssessmentRankingItem[] => {
  const topScore = Math.max(...Object.values(rawScores), 1);
  const normalizedScores = Object.fromEntries(
    HOLLAND_GROUPS.map((group) => [group, rawScores[group] / topScore]),
  ) as Record<HollandGroup, number>;

  const rankedProfiles = resultProfiles
    .filter((profile): profile is ResultProfileLike & { resultCode: Exclude<MajorResult, 'Fallback'> } => profile.resultCode !== 'Fallback')
    .map((profile) => ({
      profile,
      affinityScore:
        HOLLAND_GROUPS.reduce(
          (sum, group) => sum + normalizedScores[group] * RESULT_AFFINITY_WEIGHTS[profile.resultCode][group],
          0,
        ) + (specialActions.includes(profile.resultCode) ? SPECIAL_ACTION_MATCH_BONUS : 0),
    }))
    .sort((a, b) => b.affinityScore - a.affinityScore);

  const topAffinityScore = rankedProfiles[0]?.affinityScore || 1;

  return rankedProfiles.map(({ profile, affinityScore }) => toRankingItem(profile, affinityScore, topAffinityScore));
};

export function calculateQuizAnalysis(
  hollandScores: QuizScores,
  situationalAnswers: SituationalAnswerForScoring[],
  resultProfiles: ResultProfileLike[],
): QuizAnalysis {
  const rawScores: QuizScores = { ...hollandScores };

  situationalAnswers.forEach((answer) => {
    if (!answer.bonus) return;
    Object.entries(answer.bonus).forEach(([group, bonus]) => {
      if (!bonus) return;
      rawScores[group as HollandGroup] += bonus;
    });
  });

  const sortedScores = Object.entries(rawScores)
    .map(([group, score]) => ({ group: group as HollandGroup, score }))
    .sort((a, b) => b.score - a.score);

  const top1 = sortedScores[0];
  const top2 = sortedScores[1];
  const top3 = sortedScores[2];
  const specialActions = unique(situationalAnswers.map((answer) => answer.specialAction));
  const { resultCode, fallbackTriggered } = resolveResultCode(top1, top2, top3, specialActions);
  const ranking = buildRanking(rawScores, specialActions, resultProfiles);
  const profileMap = getProfileMap(resultProfiles);

  if (resultCode !== 'Fallback' && !profileMap.has(resultCode)) {
    throw new Error(`Missing result profile for ${resultCode}`);
  }

  return {
    resultCode,
    rawScores,
    topTraits: sortedScores.slice(0, 3).map((item) => item.group),
    ranking,
    hollandBreakdown: buildHollandBreakdown(rawScores),
    scoringMeta: {
      dominantCode: [top1.group, top2.group].sort().join(''),
      spreadFromTop1ToTop3: top1.score - top3.score,
      fallbackTriggered,
      specialActions,
    },
  };
}

export function calculateQuizResult(
  hollandScores: QuizScores,
  situationalAnswers: SituationalAnswerForScoring[],
  resultProfiles: ResultProfileLike[],
): MajorResult {
  return calculateQuizAnalysis(hollandScores, situationalAnswers, resultProfiles).resultCode;
}
