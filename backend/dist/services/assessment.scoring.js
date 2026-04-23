import { HttpError } from '../utils/httpError.js';
import { assessmentCatalog } from './assessment.catalog.js';
import { HOLLAND_GROUPS, QUIZ_SCORING_THRESHOLDS, RESULT_AFFINITY_WEIGHTS, RESULT_CODE_BY_PAIR, RESULT_MATCH_PERCENT, SPECIAL_ACTION_MATCH_BONUS, } from './assessment.constants.js';
const unique = (values) => [
    ...new Set(values.filter((value) => Boolean(value))),
];
const getPrimaryTraits = (resultCode) => Object.entries(RESULT_AFFINITY_WEIGHTS[resultCode])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([group]) => group);
const buildResultDecision = (resultCode, fallbackTriggered) => ({
    resultCode,
    fallbackTriggered,
});
const resolveResultCode = ({ top1, top2, top3, specialActions, }) => {
    if (!top1 || !top2 || !top3) {
        throw new HttpError(500, 'Unable to score assessment');
    }
    const fallbackTriggered = top1.score < QUIZ_SCORING_THRESHOLDS.fallbackTopScore ||
        top1.score - top3.score <= QUIZ_SCORING_THRESHOLDS.fallbackSpread;
    if (fallbackTriggered) {
        return buildResultDecision('Fallback', fallbackTriggered);
    }
    const dominantPairCode = [top1.group, top2.group].sort().join('');
    // C + I rơi vào nhánh kỹ thuật hoặc dữ liệu tùy theo lựa chọn tình huống để tránh hai profile quá giống nhau.
    if (dominantPairCode === 'CI') {
        return buildResultDecision(specialActions.includes('Data') ? 'Data' : 'SE', fallbackTriggered);
    }
    if (RESULT_CODE_BY_PAIR[dominantPairCode]) {
        return buildResultDecision(RESULT_CODE_BY_PAIR[dominantPairCode], fallbackTriggered);
    }
    if (specialActions.includes('Data'))
        return buildResultDecision('Data', fallbackTriggered);
    if (specialActions.includes('UXUI'))
        return buildResultDecision('UXUI', fallbackTriggered);
    if (specialActions.includes('QLDA'))
        return buildResultDecision('QLDA', fallbackTriggered);
    return buildResultDecision('SE', fallbackTriggered);
};
const buildHollandBreakdown = (totalScores, sortedScores) => {
    const topScore = Math.max(...Object.values(totalScores), 0);
    const rankMap = new Map(sortedScores.map((item, index) => [item.group, index + 1]));
    return HOLLAND_GROUPS.map((group) => ({
        code: group,
        score: totalScores[group],
        percent: topScore > 0 ? Math.round((totalScores[group] / topScore) * 100) : 0,
        rank: rankMap.get(group) || HOLLAND_GROUPS.length,
    }));
};
const buildMajorRanking = (totalScores, specialActions) => {
    const topScore = Math.max(...Object.values(totalScores), 1);
    const normalizedScores = Object.fromEntries(HOLLAND_GROUPS.map((group) => [group, totalScores[group] / topScore]));
    const ranking = assessmentCatalog.resultOrder
        .filter((resultCode) => resultCode !== 'Fallback')
        .map((resultCode) => {
        const profile = assessmentCatalog.resultProfiles[resultCode];
        const affinityScore = HOLLAND_GROUPS.reduce((sum, group) => sum + normalizedScores[group] * RESULT_AFFINITY_WEIGHTS[resultCode][group], 0) + (specialActions.includes(resultCode) ? SPECIAL_ACTION_MATCH_BONUS : 0);
        return {
            resultCode,
            title: profile.title,
            headline: profile.headline,
            affinityScore,
            primaryTraits: getPrimaryTraits(resultCode),
            matchedCareers: profile.matchedCareers,
            suggestedMajors: profile.majorSlugs,
        };
    })
        .sort((a, b) => b.affinityScore - a.affinityScore);
    const topAffinityScore = ranking[0]?.affinityScore || 1;
    return ranking.map((item) => {
        const matchPercent = Math.round(RESULT_MATCH_PERCENT.base + (item.affinityScore / topAffinityScore) * RESULT_MATCH_PERCENT.range);
        return {
            ...item,
            matchPercent,
            confidence: matchPercent >= 90 ? 'high' : matchPercent >= 75 ? 'medium' : 'low',
        };
    });
};
export const scoreAssessment = (hollandScores, situationalAnswers) => {
    // Backend vẫn tự chấm điểm lại từ raw answers để kết quả lưu DB không phụ thuộc vào client-side calculation.
    const totalScores = { ...hollandScores };
    situationalAnswers.forEach((answer) => {
        Object.entries(answer.bonus).forEach(([group, bonus]) => {
            if (typeof bonus === 'number') {
                totalScores[group] += bonus;
            }
        });
    });
    const sortedScores = Object.entries(totalScores)
        .map(([group, score]) => ({ group: group, score }))
        .sort((a, b) => b.score - a.score);
    const [top1, top2, top3] = sortedScores;
    const specialActions = unique(situationalAnswers.map((answer) => answer.specialAction));
    const dominantCode = top1 && top2 ? [top1.group, top2.group].sort().join('') : '';
    const spreadFromTop1ToTop3 = top1 && top3 ? top1.score - top3.score : 0;
    const { resultCode, fallbackTriggered } = resolveResultCode({ top1, top2, top3, specialActions });
    return {
        resultCode,
        totalScores,
        sortedScores,
        ranking: buildMajorRanking(totalScores, specialActions),
        hollandBreakdown: buildHollandBreakdown(totalScores, sortedScores),
        scoringMeta: {
            dominantCode,
            spreadFromTop1ToTop3,
            fallbackTriggered,
            specialActions,
        },
    };
};
export const buildAssessmentSummary = ({ resultCode, sortedScores, ranking, hollandBreakdown, scoringMeta, }) => {
    const profile = assessmentCatalog.resultProfiles[resultCode];
    const topTraits = sortedScores.slice(0, 3).map((item) => item.group);
    return {
        title: profile.title,
        headline: profile.headline,
        description: profile.description,
        matchedCareers: profile.matchedCareers,
        suggestedMajors: profile.majorSlugs,
        suggestedMentorExpertise: profile.mentorExpertise,
        topTraits,
        ranking,
        hollandBreakdown,
        scoringMeta,
    };
};
