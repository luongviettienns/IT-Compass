/**
 * @file MentorPage.tsx - Layout shell cho Mentor Portal.
 *
 * Mobile: hamburger menu button opens sidebar as a drawer overlay.
 * Desktop: sidebar cố định bên trái.
 * Nested routes: /mentor (overview), /mentor/profile, /mentor/preview.
 */

import { Routes, Route, Outlet } from 'react-router-dom';
import { MentorSidebar } from '../../components/layout/MentorSidebar';
import { Menu } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { Loader } from '../../components/ui/Loader';

const MentorOverview = lazy(() => import('./MentorOverview'));
const MentorProfileEdit = lazy(() => import('./MentorProfileEdit'));
const MentorPreview = lazy(() => import('./MentorPreview'));
const MentorAvailabilityPage = lazy(() => import('./MentorAvailabilityPage'));
const MentorBookingsPage = lazy(() => import('./MentorBookingsPage'));
const MessagesPage = lazy(() => import('../MessagesPage'));

function MentorLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex h-screen w-full bg-[#FAFBFC] overflow-hidden">
            <MentorSidebar
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
                collapsed={collapsed}
                onCollapsedChange={setCollapsed}
            />

            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                {/* Mobile header with hamburger - only visible on mobile */}
                <header className="flex md:hidden h-14 items-center border-b bg-background px-4 shrink-0">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 -ml-1 rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
                        aria-label="Mở menu"
                    >
                        <Menu size={20} />
                    </button>
                    <span className="ml-3 text-sm font-bold">Mentor Portal</span>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto">
                    <Suspense
                        fallback={
                            <div className="flex h-full items-center justify-center">
                                <Loader />
                            </div>
                        }
                    >
                        <Outlet />
                    </Suspense>
                </main>
            </div>
        </div>
    );
}

export default function MentorPage() {
    return (
        <Routes>
            <Route element={<MentorLayout />}>
                <Route index element={<MentorOverview />} />
                <Route path="bookings" element={<MentorBookingsPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="availability" element={<MentorAvailabilityPage />} />
                <Route path="profile" element={<MentorProfileEdit />} />
                <Route path="preview" element={<MentorPreview />} />
            </Route>
        </Routes>
    );
}
