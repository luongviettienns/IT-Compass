import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

import { ChatThread } from '../components/chat/ChatThread';
import { ConversationList } from '../components/chat/ConversationList';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { bookingApi } from '../lib/bookingApi';
import { bookingQueryKeys } from '../lib/bookingQueryKeys';
import { conversationApi, type Conversation, type ConversationMessage } from '../lib/conversationApi';
import { conversationQueryKeys } from '../lib/conversationQueryKeys';
import { getErrorMessage } from '../lib/appError';
import { cn } from '../lib/utils';

export default function MessagesPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(searchParams.get('conversationId'));
    const [showThreadOnMobile, setShowThreadOnMobile] = useState(Boolean(searchParams.get('conversationId')));

    const listParams = useMemo(() => ({ limit: 50 }), []);
    const messagesParams = useMemo(() => ({ limit: 100 }), []);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.role === 'MENTOR' && location.pathname === '/messages') {
            navigate(`/mentor/messages${location.search}`, { replace: true });
        }
    }, [location.pathname, location.search, navigate, user?.role]);

    const conversationsQuery = useQuery({
        queryKey: conversationQueryKeys.list(listParams),
        queryFn: () => conversationApi.listConversations(listParams),
        enabled: !(user?.role === 'MENTOR' && location.pathname === '/messages'),
    });

    const conversations = conversationsQuery.data?.conversations ?? [];
    const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId) ?? conversations[0] ?? null;

    useEffect(() => {
        if (!selectedConversation || selectedConversationId) return;
        setSelectedConversationId(selectedConversation.id);
    }, [selectedConversation, selectedConversationId]);

    const messagesQuery = useQuery({
        queryKey: conversationQueryKeys.messages(selectedConversation?.id ?? 'none', messagesParams),
        queryFn: () => conversationApi.listMessages(selectedConversation?.id ?? '', messagesParams),
        enabled: Boolean(selectedConversation),
    });

    const sendFallbackMutation = useMutation({
        mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) => conversationApi.createMessage(conversationId, content),
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: conversationQueryKeys.messagesRoot(variables.conversationId) });
            await queryClient.invalidateQueries({ queryKey: conversationQueryKeys.all });
        },
        onError: (error) => toast.error(getErrorMessage(error, 'Không thể gửi tin nhắn.')),
    });

    const completeBookingMutation = useMutation({
        mutationFn: (bookingId: string) => bookingApi.completeMentorBooking(bookingId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: conversationQueryKeys.all });
            await queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all });
            toast.success('Đã kết thúc sớm buổi tư vấn.');
        },
        onError: (error) => toast.error(getErrorMessage(error, 'Không thể kết thúc sớm buổi tư vấn.')),
    });

    const sendFallback = async (content: string): Promise<ConversationMessage> => {
        if (!selectedConversation) {
            toast.error('Vui lòng chọn cuộc trò chuyện trước khi gửi tin nhắn.');
            throw new Error('Conversation is required');
        }

        const normalizedContent = content.trim();
        if (!normalizedContent) {
            toast.error('Vui lòng nhập nội dung tin nhắn.');
            throw new Error('Message content is required');
        }

        const result = await sendFallbackMutation.mutateAsync({ conversationId: selectedConversation.id, content: normalizedContent });
        return result.data;
    };

    const completeEarly = async () => {
        if (!selectedConversation || user?.role !== 'MENTOR') return;
        await completeBookingMutation.mutateAsync(selectedConversation.booking.id);
    };

    const handleSelect = (conversation: Conversation) => {
        setSelectedConversationId(conversation.id);
        setShowThreadOnMobile(true);
        setSearchParams({ conversationId: conversation.id });
    };

    const showListPane = !showThreadOnMobile;
    const showThreadPane = showThreadOnMobile;

    return (
        <>
            <Helmet>
                <title>Tin nhắn — IT Compass</title>
            </Helmet>

            <div className="h-[calc(100vh-4rem)] bg-[#F7F9FC] p-3 sm:p-6 lg:p-8">
                <Card className="mx-auto grid h-full max-w-7xl overflow-hidden rounded-[28px] border-border/70 shadow-xl shadow-primary/5 lg:grid-cols-[360px_1fr] lg:rounded-[32px]">
                    <aside
                        className={cn(
                            'min-h-0 border-border bg-background lg:block lg:border-r',
                            showListPane ? 'block' : 'hidden',
                        )}
                    >
                        <div className="border-b border-border px-5 py-4">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Tin nhắn</p>
                            <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Cuộc trò chuyện</h1>
                            <p className="mt-1 text-sm text-muted-foreground lg:hidden">
                                Chọn một cuộc trò chuyện để mở toàn màn hình trên điện thoại.
                            </p>
                        </div>
                        {conversationsQuery.error ? (
                            <div className="p-4 text-sm text-destructive">
                                {getErrorMessage(conversationsQuery.error, 'Không thể tải danh sách tin nhắn.')}
                            </div>
                        ) : (
                            <ConversationList
                                conversations={conversations}
                                selectedConversationId={selectedConversation?.id ?? null}
                                user={user}
                                isLoading={conversationsQuery.isLoading}
                                onSelect={handleSelect}
                            />
                        )}
                    </aside>

                    <main className={cn('min-h-0 lg:block', showThreadPane ? 'block' : 'hidden')}>
                        {conversationsQuery.isLoading || selectedConversation ? (
                            <ChatThread
                                conversation={selectedConversation}
                                messages={messagesQuery.data?.messages ?? []}
                                currentUser={user}
                                isLoading={messagesQuery.isLoading}
                                onBack={() => setShowThreadOnMobile(false)}
                                onSendFallback={sendFallback}
                                onCompleteEarly={completeEarly}
                                isCompletingEarly={completeBookingMutation.isPending}
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center p-6">
                                <EmptyState
                                    icon={<MessageCircle size={28} />}
                                    title="Chưa có tin nhắn"
                                    description="Tin nhắn sẽ mở khi một lịch tư vấn được mentor xác nhận."
                                />
                            </div>
                        )}
                    </main>
                </Card>
            </div>
        </>
    );
}
