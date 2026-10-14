import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { MotionConfig } from 'motion/react';
import AdminDashboard from '../src/pages/admin/AdminDashboard';
import AdminUsersPage from '../src/pages/admin/AdminUsersPage';
import AdminMentorsPage from '../src/pages/admin/AdminMentorsPage';
import AdminAssessmentsPage from '../src/pages/admin/AdminAssessmentsPage';
import { adminUserApi } from '../src/lib/adminUserApi';
import { adminMentorApi } from '../src/lib/adminMentorApi';
import { assessmentApi } from '../src/lib/assessmentApi';
import { blogApi } from '../src/lib/blogApi';
import { adminQueryKeys } from '../src/lib/adminQueryKeys';

vi.mock('../src/contexts/AuthContext',()=>({useAuth:()=>({user:{fullName:'Admin test'},isAuthenticated:true,isInitialized:true})}));
vi.mock('recharts',()=>({ResponsiveContainer:({children}:{children:React.ReactNode})=><div>{children}</div>,LineChart:()=>null,BarChart:()=>null,Line:()=>null,Bar:()=>null,Cell:()=>null,CartesianGrid:()=>null,XAxis:()=>null,YAxis:()=>null,Tooltip:()=>null}));
const pagination={page:1,limit:10,total:0,totalPages:1};
const users={users:[],pagination,summary:{total:0,active:0,suspended:0,blocked:0,verified:0,withProfile:0}};
const mentors={mentors:[],pagination,summary:{total:0,active:0,paused:0,verified:0}};
const stats={stats:{totalAttempts:0,completedUsers:0,completionRate:0,resultDistribution:[],trend:[]}};
const userStats={stats:{total:0,byStatus:{active:0,suspended:0,blocked:0},byRole:{student:0,mentor:0,admin:0},verification:{verified:0,unverified:0},profile:{withProfile:0,withoutProfile:0}}};
let client:QueryClient;
const mount=(page:React.ReactNode)=>{client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});render(<HelmetProvider><QueryClientProvider client={client}><MemoryRouter><MotionConfig reducedMotion="always">{page}</MotionConfig></MemoryRouter></QueryClientProvider></HelmetProvider>);return userEvent.setup();};
beforeEach(()=>{
  vi.spyOn(adminUserApi,'listUsers').mockResolvedValue(users);
  vi.spyOn(adminUserApi,'getUserStats').mockResolvedValue(userStats);
  vi.spyOn(adminMentorApi,'listMentors').mockResolvedValue(mentors);
  vi.spyOn(assessmentApi,'getAdminStats').mockResolvedValue(stats);
  vi.spyOn(assessmentApi,'getAdminAttempts').mockResolvedValue({attempts:[],pagination});
  vi.spyOn(blogApi,'adminStats').mockResolvedValue({stats:{total:0,published:0,draft:0,scheduled:0,deleted:0,totalComments:0,hiddenComments:0}});
});
afterEach(()=>{cleanup();client?.clear();vi.restoreAllMocks();});

describe('admin query states',()=>{
  it('shows a failed dashboard metric as an error while successful metrics remain available',async()=>{
    vi.mocked(adminUserApi.getUserStats).mockRejectedValue(new Error('Injected 500 users'));
    mount(<AdminDashboard/>);
    const label=await screen.findByText('Tổng người dùng');
    const card=label.closest('.group')!;
    await waitFor(()=>expect(within(card as HTMLElement).queryByRole('alert')).not.toBeNull());
    expect(within(card as HTMLElement).queryByText('0')).toBeNull();
    expect(screen.getByText('Tổng bài viết')).toBeTruthy();
  });
  it('shows a genuine successful zero on the dashboard',async()=>{
    mount(<AdminDashboard/>);
    const label=await screen.findByText('Tổng người dùng');
    await waitFor(()=>expect(within(label.closest('.group') as HTMLElement).getByText('0')).toBeTruthy());
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('keeps user search/filter state and retries the failed list',async()=>{
    const api=vi.mocked(adminUserApi.listUsers).mockRejectedValue(new Error('Injected 500 users'));
    const user=mount(<AdminUsersPage/>);
    await screen.findByRole('alert');
    expect(screen.queryByText('Không tìm thấy người dùng nào.')).toBeNull();
    expect(screen.queryByText('0')).toBeNull();
    await user.type(screen.getByPlaceholderText('Tìm kiếm theo tên hoặc email...'),'Lan');
    await user.click(screen.getByRole('button',{name:'Bị chặn'}));
    await screen.findByRole('alert');
    api.mockResolvedValue(users);
    await user.click(screen.getByRole('button',{name:'Thử lại'}));
    await screen.findByText('Không tìm thấy người dùng nào.');
    expect(api).toHaveBeenLastCalledWith(expect.objectContaining({search:'Lan',status:'BLOCKED',page:1}));
    expect((screen.getByPlaceholderText('Tìm kiếm theo tên hoặc email...') as HTMLInputElement).value).toBe('Lan');
  });
  it('does not show a zero mentor summary or empty table on list failure',async()=>{
    vi.mocked(adminMentorApi.listMentors).mockRejectedValue(new Error('Injected 500 mentors'));
    mount(<AdminMentorsPage/>);
    await screen.findByRole('alert');
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.queryByText(/Không (có|tìm thấy).*mentor/i)).toBeNull();
  });
  it('does not treat a successful but malformed mentor response as zero counts',async()=>{
    vi.mocked(adminMentorApi.listMentors).mockResolvedValue({} as Awaited<ReturnType<typeof adminMentorApi.listMentors>>);
    mount(<AdminMentorsPage/>);await screen.findByRole('alert');
    expect(screen.queryByText('0')).toBeNull();
  });
  it('does not turn missing assessment statistics into valid zeros',async()=>{
    vi.mocked(assessmentApi.getAdminStats).mockResolvedValue({stats:{}} as Awaited<ReturnType<typeof assessmentApi.getAdminStats>>);
    mount(<AdminAssessmentsPage/>);await screen.findByRole('alert');
    expect(screen.queryByText('0%')).toBeNull();
    expect(await screen.findByText('Không có assessment nào khớp bộ lọc.')).toBeTruthy();
  });
  it('retries the failed second user page without returning to page one',async()=>{
    let failSecond=true;
    const rows=Array.from({length:11},(_,index)=>({id:String(index+1),fullName:`Page user ${index+1}`,email:`page${index+1}@example.test`,role:'STUDENT' as const,status:'ACTIVE' as const,emailVerified:true,hasProfile:false,createdAt:'2026-10-13T08:00:00Z',updatedAt:'2026-10-13T08:00:00Z'}));
    const api=vi.mocked(adminUserApi.listUsers).mockImplementation(async query=>{
      const page=query?.page || 1;if(page===2&&failSecond)throw new Error('Injected page 2 failure');
      return {...users,users:rows.slice((page-1)*10,page*10),pagination:{...pagination,page,total:11,totalPages:2},summary:{...users.summary,total:11}};
    });
    const user=mount(<AdminUsersPage/>);await screen.findByText('Page user 1');
    await user.click(screen.getByRole('button',{name:'Trang sau'}));await screen.findByRole('alert');
    failSecond=false;await user.click(screen.getByRole('button',{name:'Thử lại'}));
    await screen.findByText('Page user 11');expect(api).toHaveBeenLastCalledWith(expect.objectContaining({page:2}));
  });
  it('keeps the successful assessment list independent of failed statistics',async()=>{
    vi.mocked(assessmentApi.getAdminStats).mockRejectedValue(new Error('Injected 500 statistics'));
    mount(<AdminAssessmentsPage/>);
    await screen.findByRole('alert');
    expect(screen.queryByText('0%')).toBeNull();
    expect(await screen.findByText('Không có assessment nào khớp bộ lọc.')).toBeTruthy();
  });
  it('does not claim the assessment list is empty when that API failed',async()=>{
    vi.mocked(assessmentApi.getAdminAttempts).mockRejectedValue(new Error('Injected 500 attempts'));
    mount(<AdminAssessmentsPage/>);
    await screen.findByRole('alert');
    expect(screen.queryByText('Không có assessment nào khớp bộ lọc.')).toBeNull();
    expect(screen.getByText('0%')).toBeTruthy();
  });
  it('hides cached actionable user rows after a failed background refresh',async()=>{
    const row={id:'17',fullName:'Cached test user',email:'cached@example.test',role:'STUDENT' as const,status:'ACTIVE' as const,emailVerified:true,hasProfile:false,createdAt:'2026-10-13T08:00:00Z',updatedAt:'2026-10-13T08:00:00Z'};
    vi.mocked(adminUserApi.listUsers).mockResolvedValue({...users,users:[row],summary:{...users.summary,total:1}});
    mount(<AdminUsersPage/>);await screen.findByText(row.fullName);
    vi.mocked(adminUserApi.listUsers).mockRejectedValue(new Error('Injected refresh failure'));
    await act(async()=>{await client.refetchQueries({queryKey:adminQueryKeys.usersRoot});});
    await screen.findByRole('alert');
    expect(screen.queryByText(row.fullName)).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });
  it('keeps export choices open when a background read fails and permits retry',async()=>{
    const row={id:'18',fullName:'Export test user',email:'export@example.test',role:'STUDENT' as const,status:'ACTIVE' as const,emailVerified:true,hasProfile:false,createdAt:'2026-10-13T08:00:00Z',updatedAt:'2026-10-13T08:00:00Z'};
    const payload={...users,users:[row],summary:{...users.summary,total:1},pagination:{...pagination,total:1}};
    const api=vi.mocked(adminUserApi.listUsers).mockResolvedValue(payload);
    const user=mount(<AdminUsersPage/>);await screen.findByText(row.fullName);
    await user.click(screen.getByRole('button',{name:'Export'}));
    const dialog=await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button',{name:'CSV'}));
    const name=within(dialog).getByPlaceholderText('Nhập tên file...');await user.clear(name);await user.type(name,'kept-export-choice');
    api.mockRejectedValue(new Error('Injected background failure'));
    await act(async()=>{await client.refetchQueries({queryKey:adminQueryKeys.usersRoot});});
    await within(dialog).findByRole('button',{name:'Tải lại dữ liệu'});
    expect(screen.getByRole('dialog')).toBe(dialog);
    expect((within(dialog).getByPlaceholderText('Nhập tên file...') as HTMLInputElement).value).toBe('kept-export-choice');
    expect((within(dialog).getByRole('button',{name:'Xuất file'}) as HTMLButtonElement).disabled).toBe(true);
    api.mockResolvedValue(payload);await user.click(within(dialog).getByRole('button',{name:'Tải lại dữ liệu'}));
    await waitFor(()=>expect((within(dialog).getByRole('button',{name:'Xuất file'}) as HTMLButtonElement).disabled).toBe(false));
    expect((within(dialog).getByPlaceholderText('Nhập tên file...') as HTMLInputElement).value).toBe('kept-export-choice');
    expect(within(dialog).getByRole('button',{name:'CSV'}).getAttribute('aria-pressed')).toBe('true');
  });
});
