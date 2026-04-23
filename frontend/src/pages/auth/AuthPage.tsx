import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, LogIn, Mail, UserRound, BriefcaseBusiness, UserRoundPlus, Code2, Database, Shield, Palette } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { getErrorMessage } from '../../lib/appError';
import type { AuthPageState } from '../../lib/authNavigation';
import { isQuizRedirect, resolvePostAuthRoute, sanitizeRedirectTo } from '../../lib/authNavigation';
import { cn } from '../../lib/utils';
import { CompassLogo } from '../../components/shared/CompassLogo';

type RegisterRole = 'STUDENT' | 'MENTOR';
type AuthMode = 'login' | 'register';

export default function AuthPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { login, register, isAuthenticated, user } = useAuth();

    const isLoginMode = location.pathname.includes('login');
    const mode: AuthMode = isLoginMode ? 'login' : 'register';

    const authState = (location.state as AuthPageState | null) ?? null;
    const redirectParam = searchParams.get('redirect');
    const redirectTo = useMemo(
        () => sanitizeRedirectTo(redirectParam ?? authState?.redirectTo),
        [authState?.redirectTo, redirectParam],
    );

    // Login state
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register state
    const [fullName, setFullName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<RegisterRole>('STUDENT');

    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (isAuthenticated && user) {
        return (
            <Navigate
                to={resolvePostAuthRoute(user.role, redirectTo)}
                replace
                state={authState?.returnToQuizResult ? authState : undefined}
            />
        );
    }

    const toggleMode = () => {
        setFormError(null);
        if (mode === 'login') {
            navigate(redirectTo ? `/auth/register?redirect=${encodeURIComponent(redirectTo)}` : '/auth/register', { replace: true });
        } else {
            navigate(redirectTo ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}` : '/auth/login', { replace: true });
        }
    };

    const handleLoginSubmit = async () => {
        setFormError(null);

        if (!loginEmail.trim() || !loginPassword) {
            setFormError('Vui lòng nhập đầy đủ email và mật khẩu.');
            return;
        }

        setIsSubmitting(true);
        try {
            const authenticatedUser = await login(loginEmail.trim(), loginPassword);
            const destination = resolvePostAuthRoute(authenticatedUser.role, redirectTo);

            toast.success(
                isQuizRedirect(redirectTo)
                    ? 'Đăng nhập thành công. Bạn có thể tiếp tục nộp bài trắc nghiệm.'
                    : 'Đăng nhập thành công.',
            );

            navigate(destination, {
                replace: true,
                state: authState?.returnToQuizResult ? authState : undefined,
            });
        } catch (error) {
            setFormError(getErrorMessage(error, 'Không thể đăng nhập lúc này.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegisterSubmit = async () => {
        setFormError(null);

        if (!fullName.trim() || !registerEmail.trim() || !registerPassword || !confirmPassword) {
            setFormError('Vui lòng điền đầy đủ thông tin.');
            return;
        }

        if (fullName.trim().length < 2) {
            setFormError('Họ tên cần có ít nhất 2 ký tự.');
            return;
        }

        if (registerPassword.length < 8) {
            setFormError('Mật khẩu cần có ít nhất 8 ký tự.');
            return;
        }

        if (registerPassword !== confirmPassword) {
            setFormError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setIsSubmitting(true);
        try {
            const authenticatedUser = await register(fullName.trim(), registerEmail.trim(), registerPassword, role);
            const destination = resolvePostAuthRoute(authenticatedUser.role, redirectTo);

            toast.success(
                isQuizRedirect(redirectTo)
                    ? 'Tạo tài khoản thành công. Bạn có thể quay lại quiz để nộp bài.'
                    : 'Tạo tài khoản thành công.',
            );

            navigate(destination, { replace: true });
        } catch (error) {
            setFormError(getErrorMessage(error, 'Không thể tạo tài khoản lúc này.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Animation Variants
    const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
    const cardVariants = {
        initial: { opacity: 0, y: 30, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: EASE } },
        exit: { opacity: 0, y: -30, scale: 0.95, transition: { duration: 0.3, ease: EASE } }
    };

    return (
        <>
            <Helmet>
                <title>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'} — IT Compass</title>
                <meta name="description" content="Đăng nhập hoặc đăng ký tài khoản IT Compass." />
            </Helmet>

            <main className="relative min-h-screen w-full flex items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_40%),linear-gradient(180deg,#ffffff,rgba(248,250,252,0.98))] px-4 py-12 overflow-hidden">
                {/* Decorative Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:48px_48px] opacity-70 pointer-events-none" />

                {/* Floating Tags (Decorative) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden max-w-6xl mx-auto">
                    {[
                        { label: 'Developer', Icon: Code2, x: '10%', y: '20%', delay: 0, rotate: -6 },
                        { label: 'Data', Icon: Database, x: '80%', y: '15%', delay: 0.2, rotate: 8 },
                        { label: 'Security', Icon: Shield, x: '15%', y: '75%', delay: 0.4, rotate: 12 },
                        { label: 'Design', Icon: Palette, x: '75%', y: '70%', delay: 0.6, rotate: -10 },
                    ].map((tag) => (
                        <motion.div
                            key={tag.label}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: tag.delay, duration: 0.8, ease: "easeOut" }}
                            className="absolute hidden lg:flex items-center gap-2 rounded-full bg-background/90 px-4 py-2.5 text-sm font-semibold text-foreground shadow-xl border border-border/80 backdrop-blur-md"
                            style={{ left: tag.x, top: tag.y, transform: `rotate(${tag.rotate}deg)` }}
                        >
                            <tag.Icon size={16} className="text-primary" />
                            {tag.label}
                        </motion.div>
                    ))}
                </div>

                <div className="relative z-10 w-full max-w-[460px]">
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-block transition-transform hover:scale-105">
                            <CompassLogo size={56} className="text-primary" />
                        </Link>
                    </div>

                    <AnimatePresence mode="wait">
                        {mode === 'login' ? (
                            <motion.div
                                key="login-card"
                                variants={cardVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="w-full"
                            >
                                <Card className="rounded-[32px] border-border/80 shadow-2xl shadow-primary/10 bg-background/80 backdrop-blur-xl">
                                    <CardHeader className="space-y-2 pb-6 text-center">
                                        <CardTitle className="text-3xl font-black tracking-tight">Đăng nhập</CardTitle>
                                        <CardDescription className="text-sm font-medium">Bắt đầu hành trình IT của bạn</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form
                                            className="space-y-4"
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                void handleLoginSubmit();
                                            }}
                                        >
                                            <Input
                                                label="Email"
                                                type="email"
                                                placeholder="ban@truonghoc.edu.vn"
                                                icon={<Mail size={16} />}
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                            />
                                            <Input
                                                label="Mật khẩu"
                                                type="password"
                                                placeholder="Tối thiểu 8 ký tự"
                                                icon={<KeyRound size={16} />}
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                            />

                                            {formError && (
                                                <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">
                                                    {formError}
                                                </div>
                                            )}

                                            <Button type="submit" size="lg" className="w-full h-12 text-base justify-center rounded-xl" isLoading={isSubmitting}>
                                                <LogIn size={18} className="mr-2" /> Đăng nhập
                                            </Button>
                                        </form>

                                        <div className="mt-6 text-center text-sm font-medium text-muted-foreground flex flex-col gap-3">
                                            <Link to={redirectTo ? `/forgot-password?redirect=${encodeURIComponent(redirectTo)}` : '/forgot-password'} className="text-primary hover:underline hover:text-primary/80 transition-colors">
                                                Quên mật khẩu?
                                            </Link>
                                            <div>
                                                Chưa có tài khoản?{' '}
                                                <button type="button" onClick={toggleMode} className="text-foreground font-bold hover:text-primary transition-colors underline decoration-primary/30 underline-offset-4">
                                                    Đăng ký ngay
                                                </button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="register-card"
                                variants={cardVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="w-full"
                            >
                                <Card className="rounded-[32px] border-border/80 shadow-2xl shadow-primary/10 bg-background/80 backdrop-blur-xl">
                                    <CardHeader className="space-y-2 pb-6 text-center">
                                        <CardTitle className="text-3xl font-black tracking-tight">Tạo tài khoản</CardTitle>
                                        <CardDescription className="text-sm font-medium">Bắt đầu hành trình IT của bạn</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form
                                            className="space-y-4"
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                void handleRegisterSubmit();
                                            }}
                                        >
                                            <div className="grid grid-cols-2 gap-2 mb-2 p-1 bg-secondary rounded-2xl">
                                                <button
                                                    type="button"
                                                    onClick={() => setRole('STUDENT')}
                                                    className={cn(
                                                        'rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-1.5 transition-all',
                                                        role === 'STUDENT' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                                                    )}
                                                >
                                                    <UserRound size={16} /> Học sinh
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setRole('MENTOR')}
                                                    className={cn(
                                                        'rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-1.5 transition-all',
                                                        role === 'MENTOR' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                                                    )}
                                                >
                                                    <BriefcaseBusiness size={16} /> Mentor
                                                </button>
                                            </div>

                                            <Input
                                                label="Họ và tên"
                                                placeholder="Nguyễn Văn A"
                                                icon={<UserRound size={16} />}
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                            />
                                            <Input
                                                label="Email"
                                                type="email"
                                                placeholder="ban@truonghoc.edu.vn"
                                                icon={<Mail size={16} />}
                                                value={registerEmail}
                                                onChange={(e) => setRegisterEmail(e.target.value)}
                                            />
                                            <Input
                                                label="Mật khẩu"
                                                type="password"
                                                placeholder="Tối thiểu 8 ký tự"
                                                icon={<KeyRound size={16} />}
                                                value={registerPassword}
                                                onChange={(e) => setRegisterPassword(e.target.value)}
                                            />
                                            <Input
                                                label="Xác nhận mật khẩu"
                                                type="password"
                                                placeholder="Nhập lại mật khẩu"
                                                icon={<KeyRound size={16} />}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />

                                            {formError && (
                                                <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">
                                                    {formError}
                                                </div>
                                            )}

                                            <Button type="submit" size="lg" className="w-full h-12 text-base justify-center rounded-xl" isLoading={isSubmitting}>
                                                <UserRoundPlus size={18} className="mr-2" /> Tạo tài khoản
                                            </Button>
                                        </form>

                                        <div className="mt-6 text-center text-sm font-medium text-muted-foreground">
                                            Đã có tài khoản?{' '}
                                            <button type="button" onClick={toggleMode} className="text-foreground font-bold hover:text-primary transition-colors underline decoration-primary/30 underline-offset-4">
                                                Đăng nhập
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </>
    );
}
