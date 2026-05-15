/**
 * @file AdminPage.tsx - Admin Portal layout shell.
 *
 * Features: Sidebar + top header with breadcrumb + content area.
 * Mobile: hamburger menu button opens sidebar as a drawer overlay.
 * All sub-pages are lazy loaded.
 */

import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { Menu, Search } from 'lucide-react';
import { lazy, Suspense, useMemo, useState } from 'react';
import { Loader } from '../../components/ui/Loader';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../../components/ui/Avatar';

// Lazy load sub-pages
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const AdminUsersPage = lazy(() => import('./AdminUsersPage'));
const AdminMentorsPage = lazy(() => import('./AdminMentorsPage'));
const AdminBlogsPage = lazy(() => import('./AdminBlogsPage'));
const AdminBlogCommentsPage = lazy(() => import('./AdminBlogCommentsPage'));
const AdminAssessmentsPage = lazy(() => import('./AdminAssessmentsPage'));
const AdminAuditLogsPage = lazy(() => import('./AdminAuditLogsPage'));
const AdminSettingsPage = lazy(() => import('./AdminSettingsPage'));

const BREADCRUMB_MAP: Record<string, string> = {
    '/admin': 'Tổng quan',
    '/admin/users': 'Người dùng',
    '/admin/mentors': 'Mentor',
    '/admin/blogs': 'Nội dung',
    '/admin/blog-comments': 'Bình luận',
    '/admin/assessments': 'Assessment',
    '/admin/audit-logs': 'Nhật ký',
    '/admin/settings': 'Cài đặt',
};

function AdminBreadcrumb() {
    const location = useLocation();
    const label = useMemo(() => {
        const path = location.pathname.replace(/\/$/, '') || '/admin';
        return BREADCRUMB_MAP[path] || 'Admin';
    }, [location.pathname]);

    return (
        <nav className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground hidden sm:inline">Admin</span>
            <span className="text-muted-foreground/50 hidden sm:inline">/</span>
            <span className="font-bold text-foreground">{label}</span>
        </nav>
    );
}

function AdminLayout() {
    const { user } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex h-screen w-full bg-surface/30 overflow-hidden">
            <AdminSidebar
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
                collapsed={collapsed}
                onCollapsedChange={setCollapsed}
            />

            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-8 shrink-0">
                    {/* Left: hamburger (mobile) + breadcrumb */}
                    <div className="flex items-center gap-3">
                        {/* Hamburger — only visible on mobile */}
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="md:hidden p-2 -ml-1 rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
                            aria-label="Mở menu"
                        >
                            <Menu size={20} />
                        </button>
                        <AdminBreadcrumb />
                    </div>

                    {/* Right: Search + Avatar */}
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm nhanh..."
                                className="w-full max-w-[220px] rounded-xl border-none bg-secondary/50 py-2 pl-10 pr-4 text-sm outline-none ring-primary/20 transition-all focus:ring-2"
                            />
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-secondary/50 px-3 py-1.5">
                            <Avatar
                                src={undefined}
                                alt={user?.fullName || 'Admin'}
                                size="xs"
                            />
                            <span className="hidden sm:block text-xs font-bold">{user?.fullName}</span>
                        </div>
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
