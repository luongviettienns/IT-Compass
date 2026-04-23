import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardCheck, BookOpen, Users, UserCircle, LogOut, User, LayoutDashboard, LogIn, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

const TABS = [
    { label: 'Trang chủ', path: '/', icon: Home },
    { label: 'Trắc nghiệm', path: '/test', icon: ClipboardCheck },
    { label: 'Blog', path: '/blog', icon: BookOpen },
    { label: 'Mentor', path: '/mentors', icon: Users },
    { label: 'Tôi', path: '/profile', icon: UserCircle },
];

export function BottomNav() {
    const { pathname } = useLocation();
    const { user, isAuthenticated, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
            <div className="flex h-16 items-center justify-around px-2">
                {TABS.map((tab) => {
                    const active = isActive(tab.path);
                    const Icon = tab.icon;

                    return tab.label === 'Tôi' ? (
                        <button
                            key={tab.path}
                            onClick={() => setMenuOpen(!menuOpen)}
                            className={cn(
                                'flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 transition-colors outline-none',
                                active || menuOpen ? 'text-primary' : 'text-muted-foreground',
                            )}
                        >
                            <Icon size={20} strokeWidth={active || menuOpen ? 2.5 : 1.5} />
                            <span className="text-[10px] font-medium truncate">{tab.label}</span>
                        </button>
                    ) : (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            className={cn(
                                'flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 transition-colors',
                                active ? 'text-primary' : 'text-muted-foreground',
                            )}
                        >
                            <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                            <span className="text-[10px] font-medium truncate">{tab.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Slide-up Profile Menu Overlay */}
            <AnimatePresence>
                {menuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
                            onClick={() => setMenuOpen(false)}
                            style={{ height: '100vh', bottom: 64 }}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="absolute bottom-16 left-0 right-0 z-50 rounded-t-[32px] border-t border-border/60 bg-background p-6 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"
                        >
                            {isAuthenticated && user ? (
                                <div className="space-y-2">
                                    <div className="mb-4 flex items-center gap-4 border-b border-border/60 pb-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                                            {user.fullName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground">{user.fullName}</p>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <Link to="/profile" className="flex items-center gap-3 rounded-2xl p-4 text-foreground hover:bg-surface/50 transition-colors">
                                        <User size={20} className="text-primary" />
                                        <span className="font-medium">Hồ sơ cá nhân</span>
                                    </Link>
                                    {user.role === 'MENTOR' && (
                                        <Link to="/mentor/dashboard" className="flex items-center gap-3 rounded-2xl p-4 text-foreground hover:bg-surface/50 transition-colors">
                                            <LayoutDashboard size={20} className="text-indigo-500" />
                                            <span className="font-medium">Mentor Dashboard</span>
                                        </Link>
                                    )}
                                    {user.role === 'ADMIN' && (
                                        <Link to="/admin" className="flex items-center gap-3 rounded-2xl p-4 text-foreground hover:bg-surface/50 transition-colors">
                                            <LayoutDashboard size={20} className="text-amber-500" />
                                            <span className="font-medium">Quản trị viên</span>
                                        </Link>
                                    )}
                                    <div className="border-t border-border/40 my-2" />
                                    <button onClick={async () => { setMenuOpen(false); await logout(); }} className="flex w-full items-center gap-3 rounded-2xl p-4 text-destructive hover:bg-destructive/5 transition-colors">
                                        <LogOut size={20} />
                                        <span className="font-medium">Đăng xuất</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="mb-2 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                            <UserCircle size={28} />
                                        </div>
                                        <h3 className="mt-3 text-xl font-bold text-foreground">Bạn chưa đăng nhập</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">Đăng nhập để lưu kết quả assessment và xem gợi ý dành riêng cho bạn.</p>
                                    </div>
                                    <Link to="/auth/login" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 font-semibold text-primary-foreground">
                                        <LogIn size={18} /> Đăng nhập ngay
                                    </Link>
                                    <Link to="/auth/register" className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 bg-transparent px-4 py-3.5 font-semibold text-foreground">
                                        <UserPlus size={18} /> Đăng ký tài khoản
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </nav>
    );
}
