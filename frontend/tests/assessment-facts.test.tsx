import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssessmentFacts } from '../src/components/assessment/AssessmentFacts';
import { assessmentApi, type AssessmentTemplate } from '../src/lib/assessmentApi';
import { assessmentQueryKeys } from '../src/lib/assessmentQueryKeys';

let client:QueryClient;
const template=(count:number,minutes:number):AssessmentTemplate=>({quizType:'IT_COMPASS_V1',version:'fixture',questionCount:count,estimatedMinutes:minutes,hollandQuestions:[],situationalQuestions:[],resultProfiles:[]});
const mount=()=>{client=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={client}><AssessmentFacts /></QueryClientProvider>);};
afterEach(()=>{cleanup();client?.clear();vi.restoreAllMocks();});
describe('assessment metadata shown to visitors',()=>{
  it('waits for live metadata and updates when the active template changes',async()=>{
    let finish!:(value:{template:AssessmentTemplate})=>void;
    vi.spyOn(assessmentApi,'getCurrentTemplate').mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
    mount();expect(screen.queryByText(/\d+ câu hỏi/)).toBeNull();
    await waitFor(()=>expect(finish).toBeTypeOf('function'));
    await act(async()=>finish({template:template(29,3)}));
    expect((await screen.findByText(/29 câu hỏi/)).textContent).toContain('Thời gian tham khảo: 3 phút');
    await act(async()=>client.setQueryData(assessmentQueryKeys.currentTemplate,{template:template(42,8)}));
    expect((await screen.findByText(/42 câu hỏi/)).textContent).toContain('Thời gian tham khảo: 8 phút');
    expect(screen.queryByText(/29 câu hỏi/)).toBeNull();
  });
  it('keeps unknown counts out of the page when the API fails',async()=>{
    vi.spyOn(assessmentApi,'getCurrentTemplate').mockRejectedValue(new Error('template unavailable'));
    mount();await waitFor(()=>expect(client.getQueryState(assessmentQueryKeys.currentTemplate)?.status).toBe('error'));
    expect(screen.queryByText(/\d+ câu hỏi|\d+ phút/)).toBeNull();
    expect(screen.getByText('Xem thông tin bài định hướng')).toBeTruthy();
  });
  it('does not turn invalid metadata into factual zero or negative counts',async()=>{
    vi.spyOn(assessmentApi,'getCurrentTemplate').mockResolvedValue({template:template(-1,0)});
    mount();await waitFor(()=>expect(client.getQueryState(assessmentQueryKeys.currentTemplate)?.status).toBe('success'));
    expect(screen.queryByText(/-?\d+ câu hỏi|\d+ phút/)).toBeNull();
  });
});
