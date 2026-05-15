import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuth } from '../../contexts/AuthContext';
import { getChatSocket } from '../../lib/chatSocket';
import { notificationQueryKeys } from '../../lib/notificationQueryKeys';
import type { Notification } from '../../lib/notificationApi';

export function RealtimeNotificationListener() {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!isAuthenticated) return;

        const socket = getChatSocket();
        if (!socket) return;

        const handleNotificationNew = (payload: { notification: Notification }) => {
            void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
            toast.info(payload.notification.title, {
                description: payload.notification.body,
                duration: 5000,
            });
        };

        const handleNotificationUpdated = () => {
            void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
        };

        socket.on('notification:new', handleNotificationNew);
        socket.on('notification:updated', handleNotificationUpdated);

        return () => {
            socket.off('notification:new', handleNotificationNew);
            socket.off('notification:updated', handleNotificationUpdated);
        };
    }, [isAuthenticated, queryClient]);

    return null;
}
