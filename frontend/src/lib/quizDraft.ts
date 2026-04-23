export const QUIZ_DRAFT_STORAGE_KEY = 'it-compass-quiz-draft-v1';
export const QUIZ_PENDING_RESULT_STORAGE_KEY = 'it-compass-quiz-pending-result-v1';

export type QuizDraft = {
  hollandAnswers?: Record<string, number>;
  situationalAnswers?: Record<string, string>;
  hollandIndex?: number;
  situationalIndex?: number;
  quizStartedAt?: string | null;
};

export type PendingQuizResult = {
  hollandAnswers: Record<string, number>;
  situationalAnswers: Record<string, string>;
  startedAt?: string | null;
};

export type DraftTemplate = {
  hollandQuestions: Array<{ id: string }>;
  situationalQuestions: Array<{
    id: string;
    options: Array<{ id: string }>;
  }>;
};

export type SituationalOptionLike = {
  id: string;
};

export const getStoredQuizDraft = () => {
  try {
    const raw = window.sessionStorage.getItem(QUIZ_DRAFT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QuizDraft) : null;
  } catch {
    return null;
  }
};

export const restoreSituationalAnswers = <TOption extends SituationalOptionLike>(
  storedAnswers: Record<string, string>,
  questions: Array<{ id: string; options: TOption[] }>,
) => {
  const restoredEntries = Object.entries(storedAnswers)
    .map(([questionId, optionId]) => {
      const question = questions.find((item) => item.id === questionId);
      const option = question?.options.find((item) => item.id === optionId);
      return option ? [questionId, option] : null;
    })
    .filter((entry): entry is [string, TOption] => Boolean(entry));

  return Object.fromEntries(restoredEntries);
};

export const serializeSituationalAnswers = <TOption extends SituationalOptionLike>(
  answers: Record<string, TOption>,
) => Object.fromEntries(Object.entries(answers).map(([key, value]) => [key, value.id]));

export const saveQuizDraft = (draft: QuizDraft) => {
  window.sessionStorage.setItem(QUIZ_DRAFT_STORAGE_KEY, JSON.stringify(draft));
};

export const clearQuizDraft = () => {
  window.sessionStorage.removeItem(QUIZ_DRAFT_STORAGE_KEY);
};

export const getPendingQuizResult = () => {
  try {
    const raw = window.sessionStorage.getItem(QUIZ_PENDING_RESULT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingQuizResult) : null;
  } catch {
    return null;
  }
};

export const isPendingQuizResultComplete = (
  pendingResult: PendingQuizResult | null | undefined,
  template: DraftTemplate,
): pendingResult is PendingQuizResult => {
  if (!pendingResult) return false;

  const hasCompleteHollandAnswers = template.hollandQuestions.every((question) => {
    const value = pendingResult.hollandAnswers?.[question.id];
    return Number.isInteger(value) && value >= 1 && value <= 5;
  });

  if (!hasCompleteHollandAnswers) return false;

  return template.situationalQuestions.every((question) => {
    const optionId = pendingResult.situationalAnswers?.[question.id];
    return question.options.some((option) => option.id === optionId);
  });
};

export const savePendingQuizResult = (pendingResult: PendingQuizResult) => {
  window.sessionStorage.setItem(QUIZ_PENDING_RESULT_STORAGE_KEY, JSON.stringify(pendingResult));
};

export const clearPendingQuizResult = () => {
  window.sessionStorage.removeItem(QUIZ_PENDING_RESULT_STORAGE_KEY);
};
