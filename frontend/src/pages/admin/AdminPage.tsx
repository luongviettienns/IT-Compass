import { Routes, Route, Outlet } from 'react-router-dom';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { Search, Bell, Grid } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { Loader } from '../../components/ui/Loader';

// Lazy load sub-pages
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const AdminUsersPage = lazy(() => import('./AdminUsersPage'));
const AdminMentorsPage = lazy(() => import('./AdminMentorsPage'));
const AdminBlogsPage = lazy(() => import('./AdminBlogsPage'));
const AdminBlogCommentsPage = lazy(() => import('./AdminBlogCommentsPage'));
const AdminAssessmentsPage = lazy(() => import('./AdminAssessmentsPage'));
const AdminAuditLogsPage = lazy(() => import('./AdminAuditLogsPage'));
const AdminSettingsPage = lazy(() => import('./AdminSettingsPage'));

function AdminLayout() {
    return (
        <div className="flex h-screen w-full bg-surface/30 overflow-hidden">
            <AdminSidebar />

            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-8">
                    <div className="flex flex-1 items-center max-w-xl">
                        <div className="relative w-full max-w-sm hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm nhanh..."
                                className="w-full rounded-xl border-none bg-secondary/50 py-2 pl-10 pr-4 text-sm outline-none ring-primary/20 transition-all focus:ring-2"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 text-muted-foreground">
                        <button className="rounded-xl p-2.5 hover:bg-secondary hover:text-foreground transition-colors border">
                            <Bell size={20} />
                        </button>
                        <button className="rounded-xl p-2.5 hover:bg-secondary hover:text-foreground transition-colors border translate-y-[1px]">
                            <Grid size={20} />
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader /></div>}>
                        <Outlet />
                    </Suspense>
                </main>
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <Routes>
            <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="mentors" element={<AdminMentorsPage />} />
                <Route path="blogs" element={<AdminBlogsPage />} />
                <Route path="blog-comments" element={<AdminBlogCommentsPage />} />
                <Route path="assessments" element={<AdminAssessmentsPage />} />
                <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
        </Routes>
    );
}
