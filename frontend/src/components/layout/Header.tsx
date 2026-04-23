import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, User, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';
import { buttonVariants } from '../ui/Button';
import { CompassLogo } from '../shared/CompassLogo';
import { useAuth } from '../../contexts/AuthContext';

const NAV_ITEMS = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Trắc nghiệm', path: '/test' },
    { label: 'Blog', path: '/blog' },
    { label: 'Mentor', path: '/mentors' },
    { label: 'Ngành học', path: '/majors' },
];

export function Header() {
    const { pathname } = useLocation();
    const { user, isAuthenticated, logout } = useAuth();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setUserMenuOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        setUserMenuOpen(false);
        await logout();
    };

    return (
        <header
            className={cn(
                'sticky top-0 z-50 w-full transition-all duration-300',
                scrolled
                    ? 'border-b bg-background/80 backdrop-blur-xl shadow-sm'
                    : 'bg-transparent',
            )}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 group">
                    <div className="transition-transform duration-300 group-hover:rotate-[15deg] group-hover:scale-110">
                        <CompassLogo size={36} className="text-primary" />
                    </div>
                    <span className="text-lg font-bold tracking-tight transition-colors duration-300 group-hover:text-primary">
                        IT <span className="text-primary">Compass</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                'relative px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {item.label}
                            {(pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))) && (
                                <motion.div
                                    layoutId="nav-indicator"
                                    className="absolute inset-x-1 -bottom-px h-0.5 bg-primary rounded-full"
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Right side - Hidden on Mobile */}
                <div className="hidden md:flex items-center gap-2">
                    {isAuthenticated && user ? (
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 rounded-full p-1 hover:bg-secondary transition-colors"
                            >
                                <Avatar src={user.profile?.avatarUrl} alt={user.fullName} size="sm" />
                                <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
                                    {user.fullName}
                                </span>
                                <ChevronDown size={14} className="hidden sm:block text-muted-foreground" />
                            </button>

                            <AnimatePresence>
                                {userMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-full mt-2 z-50 w-52 rounded-xl border bg-background/95 backdrop-blur-xl shadow-xl py-1"
                                        >
                                            <div className="px-3 py-2 border-b">
                                                <p className="text-sm font-medium truncate">{user.fullName}</p>
                                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                            </div>
                                            <Link
                                                to="/profile"
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                <User size={16} /> Hồ sơ cá nhân
                                            </Link>
                                            {user.role === 'ADMIN' && (
                                                <Link
                                                    to="/admin"
                                                    className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <LayoutDashboard size={16} /> Quản trị
                                                </Link>
                                            )}
                                            {user.role === 'MENTOR' && (
                                                <Link
                                                    to="/mentor/dashboard"
                                                    className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <LayoutDashboard size={16} /> Mentor Dashboard
                                                </Link>
                                            )}
                                            <div className="border-t" />
                                            <button
                                                onClick={handleLogout}
                                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                                            >
                                                <LogOut size={16} /> Đăng xuất
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link to="/auth/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'px-2 sm:px-3')}>
                                Đăng nhập
                            </Link>
                            <Link to="/auth/register" className={cn(buttonVariants({ size: 'sm' }), 'hidden sm:flex')}>
                                Đăng ký
                            </Link>
                        </div>
                    )}

                </div>
            </div>
        </header>
    );
}
