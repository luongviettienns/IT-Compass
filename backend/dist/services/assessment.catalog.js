import { hollandQuestionsCatalog, situationalQuestionsCatalog } from './assessment.questions.js';
import { assessmentResultProfiles } from './assessment.results.js';
export const assessmentCatalog = {
    quizType: 'IT_COMPASS_V1',
    version: '2026.04',
    estimatedMinutes: 3,
    resultOrder: ['SE', 'Data', 'Cybersecurity', 'UXUI', 'QLDA', 'DevOps', 'Fallback'],
    hollandQuestions: hollandQuestionsCatalog,
    situationalQuestions: situationalQuestionsCatalog,
    resultProfiles: assessmentResultProfiles,
};
