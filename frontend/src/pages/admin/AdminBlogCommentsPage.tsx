import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageSquareText, ChevronLeft } from 'lucide-react';
import { AdminBlogCommentsManager } from '../../components/admin/AdminBlogCommentsModal';

export default function AdminBlogCommentsPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const postId = searchParams.get('postId') || undefined;
    const initialSearch = searchParams.get('search') || '';

    const clearPostFilter = () => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('postId');
        setSearchParams(nextParams);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                        <MessageSquareText className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Quản lý bình luận blog</h1>
                        <p className="text-sm text-muted-foreground">
                            Theo dõi, ẩn hoặc xóa bình luận trên toàn bộ hệ thống blog. {postId ? 'Trang đang hiển thị bình luận của một bài viết cụ thể.' : 'Bạn có thể lọc theo bài viết ngay từ trang quản lý bài viết.'}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {postId ? (
                        <button
                            onClick={clearPostFilter}
                            className="rounded-xl border bg-background px-4 py-2.5 text-sm font-bold hover:bg-secondary transition-colors"
                        >
                            Bỏ lọc bài viết
                        </button>
                    ) : null}
                    <button
                        onClick={() => navigate('/admin/blogs')}
                        className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold hover:bg-secondary/70 transition-colors inline-flex items-center gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" /> Quay lại bài viết
                    </button>
                </div>
            </div>

            <AdminBlogCommentsManager
                embedded
                postId={postId}
                initialSearch={initialSearch}
                title={postId ? 'Bình luận của bài viết đã chọn' : 'Toàn bộ bình luận blog'}
                description={postId ? 'Danh sách dưới đây chỉ hiển thị bình luận thuộc bài viết bạn vừa chọn từ trang bài viết.' : 'Kiểm soát toàn bộ bình luận blog tại một nơi tập trung.'}
                showCloseButton={false}
            />
        </div>
    );
}
