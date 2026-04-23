import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { ArrowRight, KeyRound, LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { CompassLogo } from '../../components/shared/CompassLogo';
import { authApi } from '../../lib/authApi';
import { getErrorMessage } from '../../lib/appError';
import { sanitizeRedirectTo } from '../../lib/authNavigation';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectParam = searchParams.get('redirect');
    const redirectTo = useMemo(() => sanitizeRedirectTo(redirectParam), [redirectParam]);

    const [token, setToken] = useState(searchParams.get('token') ?? '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loginHref = redirectTo ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}` : '/auth/login';

    const handleSubmit = async () => {
        setFormError(null);
        setSuccessMessage(null);

        if (!token.trim() || !newPassword || !confirmPassword) {
            setFormError('Vui lòng nhập đầy đủ data.');
            return;
        }

        if (newPassword.length < 8) {
            setFormError('Mật khẩu mới cần có ít nhất 8 ký tự.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setFormError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setIsSubmitting(true);
        try {
            await authApi.resetPassword({ token: token.trim(), newPassword });
            const message = 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.';
            setSuccessMessage(message);
            toast.success(message);
            navigate(loginHref, { replace: true });
        } catch (error) {
            setFormError(getErrorMessage(error, 'Không thể đặt lại mật khẩu lúc này.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Đặt lại mật khẩu — IT Compass</title>
                <meta
                    name="description"
                    content="Tạo mật khẩu mới và khôi phục quyền truy cập tài khoản IT Compass."
                />
            </Helmet>

            <main className="relative min-h-screen w-full flex items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_40%),linear-gradient(180deg,#ffffff,rgba(248,250,252,0.98))] px-4 py-12 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:48px_48px] opacity-70 pointer-events-none" />

                <div className="relative z-10 w-full max-w-[460px]">
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-block transition-transform hover:scale-105">
                            <CompassLogo size={56} className="text-primary" />
                        </Link>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full"
                    >
                        <Card className="rounded-[32px] border-border/80 shadow-2xl shadow-primary/10 bg-background/80 backdrop-blur-xl">
                            <CardHeader className="space-y-2 pb-6 text-center">
                                <CardTitle className="text-3xl font-black tracking-tight">Mật khẩu mới</CardTitle>
                                <CardDescription className="text-sm font-medium">Bảo mật tài khoản của bạn</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form
                                    className="space-y-4"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        void handleSubmit();
                                    }}
                                >
                                    <Input
                                        label="Token"
                                        autoComplete="off"
                                        placeholder="Dán token đặt lại mật khẩu"
                                        icon={<KeyRound size={16} />}
                                        value={token}
                                        onChange={(event) => setToken(event.target.value)}
                                    />
                                    <Input
                                        label="Mật khẩu mới"
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder="Tối thiểu 8 ký tự"
                                        icon={<LockKeyhole size={16} />}
                                        value={newPassword}
                                        onChange={(event) => setNewPassword(event.target.value)}
                                    />
                                    <Input
                                        label="Xác nhận mật khẩu mới"
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder="Nhập lại mật khẩu mới"
                                        icon={<LockKeyhole size={16} />}
                                        value={confirmPassword}
                                        onChange={(event) => setConfirmPassword(event.target.value)}
                                    />

                                    {formError && (
                                        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">
                                            {formError}
                                        </div>
                                    )}

                                    {successMessage && (
                                        <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary">
                                            {successMessage}
                                        </div>
                                    )}

                                    <Button type="submit" size="lg" className="w-full h-12 text-base justify-center rounded-xl" isLoading={isSubmitting}>
                                        Cập nhật mật khẩu <ArrowRight size={18} className="ml-2" />
                                    </Button>
                                </form>

                                <div className="mt-6 text-center text-sm font-medium text-muted-foreground flex flex-col gap-3">
                                    <Link to={loginHref} className="text-primary hover:underline hover:text-primary/80 transition-colors">
                                        Trở lại Đăng nhập
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </main>
        </>
    );
}
