import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    Bell,
    BellDot,
    CalendarCheck,
    CalendarX,
    CheckCheck,
    Clock,
    CalendarClock,
    AlertTriangle,
    X,
    Loader2,
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { notificationApi, type Notification, type NotificationType } from '../../lib/notificationApi';
import { notificationQueryKeys } from '../../lib/notificationQueryKeys';
import { cn } from '../../lib/utils';

const NOTIFICATION_ICONS: Record<NotificationType, typeof Bell> = {
    BOOKING_REQUESTED: CalendarClock,
    BOOKING_CONFIRMED: CalendarCheck,
    BOOKING_CANCELLED_BY_STUDENT: CalendarX,
    BOOKING_CANCELLED_BY_MENTOR: CalendarX,
    BOOKING_COMPLETED: CheckCheck,
    BOOKING_NO_SHOW: AlertTriangle,
    BOOKING_REMINDER: Clock,
    SYSTEM: Bell,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
    BOOKING_REQUESTED: 'text-blue-500 bg-blue-500/10',
    BOOKING_CONFIRMED: 'text-emerald-500 bg-emerald-500/10',
    BOOKING_CANCELLED_BY_STUDENT: 'text-red-400 bg-red-400/10',
    BOOKING_CANCELLED_BY_MENTOR: 'text-red-400 bg-red-400/10',
    BOOKING_COMPLETED: 'text-emerald-500 bg-emerald-500/10',
    BOOKING_NO_SHOW: 'text-amber-500 bg-amber-500/10',
    BOOKING_REMINDER: 'text-primary bg-primary/10',
    SYSTEM: 'text-muted-foreground bg-muted',
};

const formatRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.round(diffMs / 60000);
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

function NotificationItem({
    notification,
    onRead,
    onNavigate,
}: {
    notification: Notification;
    onRead: (id: string) => void;
    onNavigate: (notification: Notification) => void;
}) {
    const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
    const colorClass = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.SYSTEM;

    return (
        <button
            onClick={() => {
                if (!notification.isRead) onRead(notification.id);
                onNavigate(notification);
            }}
            className={cn(
                'flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-secondary/60',
                !notification.isRead && 'bg-primary/[0.03]',
            )}
        >
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', colorClass)}>
                <Icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm leading-5', !notification.isRead ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground')}>
                        {notification.title}
                    </p>
                    {!notification.isRead && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                </div>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground line-clamp-2">{notification.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground/60">{formatRelativeTime(notification.createdAt)}</p>
            </div>
        </button>
    );
}

export function NotificationBell({ className, align = 'end' }: { className?: string; align?: 'start' | 'end' }) {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const panelPositionClass = align === 'start' ? 'left-0 origin-top-left' : 'right-0 origin-top-right';

    const unreadQuery = useQuery({
        queryKey: notificationQueryKeys.unreadCount,
        queryFn: () => notificationApi.getUnreadCount(),
        enabled: isAuthenticated,
        refetchInterval: 30_000,
        staleTime: 15_000,
    });

    const listQuery = useQuery({
        queryKey: notificationQueryKeys.list({ limit: 20 }),
        queryFn: () => notificationApi.list({ limit: 20 }),
        enabled: isAuthenticated && open,
        staleTime: 10_000,
    });

    const markReadMutation = useMutation({
        mutationFn: (id: string) => notificationApi.markAsRead(id),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => notificationApi.markAllAsRead(),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
        },
    });

    const handleNavigate = useCallback((notification: Notification) => {
        setOpen(false);
        const data = notification.data;
        if (data?.bookingId) {
            navigate(user?.role === 'MENTOR' ? '/mentor/bookings' : '/bookings');
        }
    }, [navigate, user?.role]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handleClick = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    if (!isAuthenticated) return null;

    const unreadCount = unreadQuery.data?.unreadCount ?? 0;
    const notifications = listQuery.data?.notifications ?? [];

    return (
        <div className={cn('relative', className)} ref={panelRef}>
            <button
                onClick={() => setOpen(!open)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}`}
            >
                {unreadCount > 0 ? <BellDot size={20} /> : <Bell size={20} />}
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                        className={cn(
                            'absolute top-full mt-2 z-50 w-80 sm:w-96 max-w-[calc(100vw-1rem)] rounded-2xl border bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/10 overflow-hidden',
                            panelPositionClass,
                        )}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <h3 className="text-sm font-bold text-foreground">Thông báo</h3>
                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => markAllReadMutation.mutate()}
                                        disabled={markAllReadMutation.isPending}
                                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-primary/5"
                                    >
                                        {markAllReadMutation.isPending ? 'Đang xử lý...' : 'Đọc tất cả'}
                                    </button>
                                )}
                                <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="max-h-[400px] overflow-y-auto p-2">
                            {listQuery.isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 size={20} className="animate-spin text-muted-foreground" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                                        <Bell size={22} />
                                    </div>
                                    <p className="mt-3 text-sm font-medium text-muted-foreground">Chưa có thông báo nào</p>
                                    <p className="mt-1 text-xs text-muted-foreground/60">Thông báo mới sẽ xuất hiện ở đây</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {notifications.map((notification) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                            onRead={(id) => markReadMutation.mutate(id)}
                                            onNavigate={handleNavigate}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="border-t px-4 py-2.5 text-center">
                                <span className="text-xs text-muted-foreground">
                                    {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả đã đọc'}
                                </span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
