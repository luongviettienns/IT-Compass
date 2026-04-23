import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    UserCheck,
    FileText,
    ShieldAlert,
    ChevronLeft,
    Compass,
    LogOut,
    Settings,
    ClipboardList,
    MessageSquare
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

const MENU_ITEMS = [
    { label: 'Tổng quan', path: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Người dùng', path: '/admin/users', icon: Users },
    { label: 'Mentor', path: '/admin/mentors', icon: UserCheck },
    { label: 'Nội dung (CMS)', path: '/admin/blogs', icon: FileText },
    { label: 'Bình luận blog', path: '/admin/blog-comments', icon: MessageSquare },
    { label: 'Assessment', path: '/admin/assessments', icon: ClipboardList },
    { label: 'Nhật ký hệ thống', path: '/admin/audit-logs', icon: ShieldAlert },
    { label: 'Cài đặt', path: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const { logout, user } = useAuth();

    return (
        <aside
            className={cn(
                "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background transition-all duration-300 ease-in-out md:relative",
                collapsed ? "w-20" : "w-64"
            )}
        >
            {/* Brand Header */}
            <div className="flex h-16 items-center justify-between px-4 border-b">
                <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                        <Compass size={24} />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="text-sm font-black uppercase tracking-tighter">IT Compass</span>
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Administrator</span>
                        </div>
                    )}
                </div>
                {!collapsed && (
                    <button
                        onClick={() => setCollapsed(true)}
                        className="rounded-lg p-1.5 hover:bg-secondary text-muted-foreground transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                )}
            </div>

            {/* Toggle Expand (when collapsed) */}
            {collapsed && (
                <button
                    onClick={() => setCollapsed(false)}
                    className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-md hover:text-primary transition-colors z-50"
                >
                    <ChevronLeft size={12} className="rotate-180" />
                </button>
            )}

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-3 overflow-y-auto overflow-x-hidden pt-6">
                {MENU_ITEMS.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) => cn(
                            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            isActive
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                {!collapsed && <span>{item.label}</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-6 hidden rounded bg-foreground px-2 py-1 text-xs text-background group-hover:block whitespace-nowrap z-[100]">
                                        {item.label}
                                    </div>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer / User Profile */}
            <div className="border-t p-4 space-y-2">
                {!collapsed && (
                    <div className="mb-4 flex items-center gap-3 rounded-xl bg-secondary/50 p-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                            {user?.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold truncate">{user?.fullName}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
                        </div>
                    </div>
                )}



                <button
                    onClick={logout}
                    className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors",
                        collapsed && "justify-center"
                    )}
                >
                    <LogOut size={20} />
                    {!collapsed && <span>Đăng xuất</span>}
                </button>
            </div>
        </aside>
    );
}
