import { ArrowLeft, CheckCheck, MessageCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { conversationQueryKeys } from '../../lib/conversationQueryKeys';
import { getChatSocket } from '../../lib/chatSocket';
import type { AuthUser } from '../../lib/authApi';
import type { Conversation, ConversationMessage } from '../../lib/conversationApi';

const canSendInConversation = (conversation: Conversation | null) => {
    if (!conversation) return false;
    return conversation.booking.status === 'CONFIRMED';
};

const getPeer = (conversation: Conversation, user: AuthUser | null) => {
    if (user?.id === conversation.student.id) {
        return {
            name: conversation.mentor.name,
            subtitle: conversation.mentor.title || conversation.mentor.expertiseArea || 'Mentor IT',
            avatarUrl: conversation.mentor.avatarUrl,
        };
    }

    return {
        name: conversation.student.fullName,
        subtitle: conversation.student.email,
        avatarUrl: conversation.student.avatarUrl,
    };
};

type ChatThreadProps = {
    conversation: Conversation | null;
    messages: ConversationMessage[];
    currentUser: AuthUser | null;
    isLoading?: boolean;
    onBack?: () => void;
    onSendFallback: (content: string) => Promise<ConversationMessage>;
    onCompleteEarly?: () => Promise<void> | void;
    isCompletingEarly?: boolean;
};

export function ChatThread({
    conversation,
    messages,
    currentUser,
    isLoading = false,
    onBack,
    onSendFallback,
    onCompleteEarly,
    isCompletingEarly = false,
}: ChatThreadProps) {
    const queryClient = useQueryClient();
    const [isSending, setIsSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const peer = useMemo(() => (conversation ? getPeer(conversation, currentUser) : null), [conversation, currentUser]);
    const canSend = canSendInConversation(conversation);
    const canCompleteEarly = Boolean(
        conversation &&
        currentUser?.role === 'MENTOR' &&
        conversation.booking.status === 'CONFIRMED' &&
        onCompleteEarly,
    );

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages.length, conversation?.id]);

    useEffect(() => {
        if (!conversation) return;
        const socket = getChatSocket();
        if (!socket) return;

        socket.emit('conversation:join', { conversationId: conversation.id });

        const handleNewMessage = (message: ConversationMessage) => {
            if (message.conversationId !== conversation.id) return;
            queryClient.setQueryData<{ messages: ConversationMessage[] }>(
                conversationQueryKeys.messages(conversation.id, { limit: 100 }),
                (current) => {
                    if (!current) return current;
                    if (current.messages.some((item) => item.id === message.id)) return current;
                    return { ...current, messages: [...current.messages, message] };
                },
            );
            void queryClient.invalidateQueries({ queryKey: conversationQueryKeys.all });
        };

        const handleSocketError = (payload: { message: string }) => {
            toast.error(payload.message || 'Không thể xử lý tin nhắn realtime.');
        };

        socket.on('message:new', handleNewMessage);
        socket.on('message:error', handleSocketError);

        return () => {
            socket.emit('conversation:leave', { conversationId: conversation.id });
            socket.off('message:new', handleNewMessage);
            socket.off('message:error', handleSocketError);
        };
    }, [conversation, queryClient]);

    const sendMessage = async (content: string) => {
        if (!conversation || !canSend) return;
        const socket = getChatSocket();
        setIsSending(true);

        try {
            if (socket) {
                await new Promise<void>((resolve, reject) => {
                    socket.emit('message:send', { conversationId: conversation.id, content }, (response) => {
                        if (response.ok) {
                            resolve();
                        } else {
                            reject(response.error);
                        }
                    });
                });
            } else {
                const message = await onSendFallback(content);
                queryClient.setQueryData<{ messages: ConversationMessage[] }>(
                    conversationQueryKeys.messages(conversation.id, { limit: 100 }),
                    (current) => current ? { ...current, messages: [...current.messages, message] } : current,
                );
            }
        } catch {
            const message = await onSendFallback(content);
            queryClient.setQueryData<{ messages: ConversationMessage[] }>(
                conversationQueryKeys.messages(conversation.id, { limit: 100 }),
                (current) => current ? { ...current, messages: [...current.messages, message] } : current,
            );
        } finally {
            setIsSending(false);
        }
    };

    if (!conversation || !peer) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <EmptyState
                    icon={<MessageCircle size={28} />}
                    title="Chọn một cuộc trò chuyện"
                    description="Chọn lịch tư vấn đã xác nhận để xem và gửi tin nhắn."
                />
            </div>
        );
    }

    return (
        <section className="flex h-full min-h-0 flex-col bg-surface/20">
            <header className="flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
                            aria-label="Quay lại danh sách tin nhắn"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <Avatar src={peer.avatarUrl} alt={peer.name} size="md" />
                    <div className="min-w-0">
                        <h2 className="truncate text-base font-bold text-foreground">{peer.name}</h2>
                        <p className="truncate text-xs text-muted-foreground">{peer.subtitle}</p>
                    </div>
                </div>
                {canCompleteEarly && onCompleteEarly && (
                    <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        isLoading={isCompletingEarly}
                        className="shrink-0"
                        onClick={() => void onCompleteEarly()}
                    >
                        <CheckCheck size={15} />
                        <span className="hidden sm:inline">Kết thúc sớm</span>
                        <span className="sm:hidden">Kết thúc</span>
                    </Button>
                )}
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Skeleton key={index} className="h-12 rounded-3xl" />
                        ))}
                    </div>
                ) : messages.length ? (
                    messages.map((message) => (
                        <MessageBubble key={message.id} message={message} currentUser={currentUser} />
                    ))
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <EmptyState
                            icon={<MessageCircle size={28} />}
                            title="Chưa có tin nhắn"
                            description="Hãy bắt đầu trao đổi về mục tiêu và nội dung buổi tư vấn."
                        />
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <MessageComposer
                disabled={!canSend}
                isSending={isSending}
                placeholder={canSend ? 'Nhập tin nhắn...' : 'Buổi tư vấn đã kết thúc, không thể gửi thêm tin nhắn.'}
                onSend={sendMessage}
            />
        </section>
    );
}
