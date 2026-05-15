import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../../contexts/AuthContext';
import { bookingQueryKeys } from '../../lib/bookingQueryKeys';
import { conversationQueryKeys } from '../../lib/conversationQueryKeys';
import { disconnectChatSocket, getChatSocket } from '../../lib/chatSocket';

export function RealtimeBookingListener() {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!isAuthenticated) {
            disconnectChatSocket();
            return;
        }

        const socket = getChatSocket();
        if (!socket) return;

        const handleBookingUpdated = () => {
            void queryClient.invalidateQueries({ queryKey: bookingQueryKeys.studentRoot });
            void queryClient.invalidateQueries({ queryKey: bookingQueryKeys.mentorRoot });
            void queryClient.invalidateQueries({ queryKey: conversationQueryKeys.all });
        };

        socket.on('booking:updated', handleBookingUpdated);

        return () => {
            socket.off('booking:updated', handleBookingUpdated);
        };
    }, [isAuthenticated, queryClient]);

    return null;
}
