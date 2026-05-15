import { SendHorizonal } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../ui/Button';

const MAX_MESSAGE_LENGTH = 4000;

type MessageComposerProps = {
    disabled?: boolean;
    placeholder?: string;
    isSending?: boolean;
    onSend: (content: string) => void;
};

export function MessageComposer({ disabled = false, placeholder = 'Nhập tin nhắn...', isSending = false, onSend }: MessageComposerProps) {
    const [content, setContent] = useState('');
    const trimmedContent = content.trim();

    const submit = () => {
        if (!trimmedContent || disabled || isSending) return;
        onSend(trimmedContent);
        setContent('');
    };

    return (
        <div className="border-t border-border bg-background p-3">
            <div className="flex items-end gap-2 rounded-3xl border border-border bg-surface/40 p-2">
                <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            submit();
                        }
                    }}
                    disabled={disabled || isSending}
                    rows={1}
                    placeholder={placeholder}
                    className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
                />
                <Button type="button" size="icon" isLoading={isSending} disabled={!trimmedContent || disabled} onClick={submit} aria-label="Gửi tin nhắn">
                    <SendHorizonal size={18} />
                </Button>
            </div>
        </div>
    );
}
