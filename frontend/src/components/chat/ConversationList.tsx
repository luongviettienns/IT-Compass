import { MessageCircle } from 'lucide-react';

import { Avatar } from '../ui/Avatar';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import type { Conversation } from '../../lib/conversationApi';
import type { AuthUser } from '../../lib/authApi';
import { cn } from '../../lib/utils';

const formatConversationTime = (value: string | null) => {
    if (!value) return 'Chưa có tin nhắn';
    return new Date(value).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
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

type ConversationListProps = {
    conversations: Conversation[];
    selectedConversationId: string | null;
    user: AuthUser | null;
    isLoading?: boolean;
    onSelect: (conversation: Conversation) => void;
};

export function ConversationList({ conversations, selectedConversationId, user, isLoading = false, onSelect }: ConversationListProps) {
    if (isLoading) {
        return (
            <div className="space-y-3 p-3">
                {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 rounded-3xl" />
                ))}
            </div>
        );
    }

    if (!conversations.length) {
        return (
            <div className="p-4">
                <EmptyState
                    icon={<MessageCircle size={28} />}
                    title="Chưa có cuộc trò chuyện"
                    description="Cuộc trò chuyện sẽ xuất hiện sau khi mentor xác nhận lịch tư vấn."
                />
            </div>
        );
    }

    return (
        <div className="space-y-2 p-3">
            {conversations.map((conversation) => {
                const peer = getPeer(conversation, user);
                const selected = selectedConversationId === conversation.id;
                return (
                    <button
                        key={conversation.id}
                        type="button"
                        onClick={() => onSelect(conversation)}
                        className={cn(
                            'flex w-full items-start gap-3 rounded-3xl border p-3 text-left transition-colors',
                            selected
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'border-transparent hover:border-border hover:bg-surface/60',
                        )}
                    >
                        <Avatar src={peer.avatarUrl} alt={peer.name} size="md" className="shrink-0" />
                        <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-3">
                                <span className="truncate text-sm font-bold text-foreground">{peer.name}</span>
                                <span className="shrink-0 text-[11px] text-muted-foreground">
                                    {formatConversationTime(conversation.lastMessageAt ?? conversation.latestMessage?.createdAt ?? null)}
                                </span>
                            </span>
                            <span className="mt-1 block truncate text-xs text-muted-foreground">{peer.subtitle}</span>
                            <span className="mt-2 block truncate text-sm text-muted-foreground">
                                {conversation.latestMessage?.content || 'Bắt đầu trao đổi về lịch tư vấn này.'}
                            </span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
