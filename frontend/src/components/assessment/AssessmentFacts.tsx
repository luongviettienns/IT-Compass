import { useQuery } from '@tanstack/react-query';
import { assessmentApi, type AssessmentTemplate } from '../../lib/assessmentApi';
import { assessmentQueryKeys } from '../../lib/assessmentQueryKeys';

/** Use the active instrument's metadata; unavailable data is never replaced by a guessed number. */
export function AssessmentFacts({ template }: { template?: AssessmentTemplate }) {
    const query = useQuery({
        queryKey: assessmentQueryKeys.currentTemplate,
        queryFn: () => assessmentApi.getCurrentTemplate(),
        enabled: !template,
        retry: false,
    });
    const current = template ?? (query.isSuccess ? query.data.template : null);
    const facts: string[] = [];
    if (current && Number.isInteger(current.questionCount) && current.questionCount > 0) facts.push(`${current.questionCount} câu hỏi`);
    if (current && Number.isFinite(current.estimatedMinutes) && current.estimatedMinutes > 0) facts.push(`Thời gian tham khảo: ${current.estimatedMinutes} phút`);
    return <span>{facts.length ? facts.join(' · ') : 'Xem thông tin bài định hướng'}</span>;
}
