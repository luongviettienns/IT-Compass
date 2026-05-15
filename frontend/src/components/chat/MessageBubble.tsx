import { Avatar } from '../ui/Avatar';
import type { ConversationMessage } from '../../lib/conversationApi';
import type { AuthUser } from '../../lib/authApi';
import { cn } from '../../lib/utils';

const formatMessageTime = (value: string) => new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
});

type MessageBubbleProps = {
    message: ConversationMessage;
    currentUser: AuthUser | null;
};

export function MessageBubble({ message, currentUser }: MessageBubbleProps) {
    const mine = currentUser?.id === message.senderUserId;

    return (
        <div className={cn('flex gap-2', mine ? 'justify-end' : 'justify-start')}>
            {!mine && <Avatar src={message.sender.avatarUrl} alt={message.sender.fullName} size="xs" className="mt-1 shrink-0" />}
            <div className={cn('max-w-[78%] space-y-1', mine && 'items-end text-right')}>
                {!mine && <p className="text-xs font-semibold text-muted-foreground">{message.sender.fullName}</p>}
                <div
                    className={cn(
                        'rounded-3xl px-4 py-2 text-sm leading-6 shadow-sm',
                        mine
                            ? 'rounded-br-lg bg-primary text-primary-foreground'
                            : 'rounded-bl-lg border border-border bg-background text-foreground',
                    )}
                >
                    {message.content}
                </div>
                <p className="text-[11px] text-muted-foreground">{formatMessageTime(message.createdAt)}</p>
            </div>
        </div>
    );
}
