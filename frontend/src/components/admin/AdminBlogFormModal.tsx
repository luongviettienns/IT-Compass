import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Search, ImageIcon, Calendar, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { blogApi } from '../../lib/blogApi';
import { adminQueryKeys } from '../../lib/adminQueryKeys';
import { Loader } from '../ui/Loader';
import { BlogContentRenderer } from '../blog/BlogContentRenderer';

const generateSlug = (text: string) => {
    return text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, '-');
};

type AdminBlogFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    postId: string | null;
    initialMode?: 'edit' | 'preview';
};

type FormStep = 'content' | 'publishing' | 'seo';
type UploadTarget = 'cover' | 'inline';

const FORM_STEPS: Array<{ key: FormStep; label: string; helper: string }> = [
    { key: 'content', label: 'Nội dung', helper: 'Soạn bài, chèn format và xem trước trực tiếp.' },
    { key: 'publishing', label: 'Xuất bản', helper: 'Trạng thái, ảnh đại diện và phân loại hiển thị.' },
    { key: 'seo', label: 'SEO', helper: 'Tối ưu tiêu đề và mô tả cho tìm kiếm.' },
];

const BLOG_STATUS_LABEL = {
    DRAFT: 'Nháp',
    SCHEDULED: 'Lên lịch đăng',
    PUBLISHED: 'Đã xuất bản',
} as const;

const EDITOR_TEMPLATES = [
    {
        label: 'H2',
        description: 'Tiêu đề mục lớn',
        apply: (selected: string) => ({ inserted: `## ${selected || 'Tiêu đề mục'}\n\n`, selectionStart: 3, selectionEnd: 3 + (selected || 'Tiêu đề mục').length }),
    },
    {
        label: 'H3',
        description: 'Tiêu đề mục nhỏ',
        apply: (selected: string) => ({ inserted: `### ${selected || 'Tiêu đề phụ'}\n\n`, selectionStart: 4, selectionEnd: 4 + (selected || 'Tiêu đề phụ').length }),
    },
    {
        label: 'B',
        description: 'In đậm',
        apply: (selected: string) => {
            const inner = selected || 'Nội dung nhấn mạnh';
            return { inserted: `**${inner}**`, selectionStart: 2, selectionEnd: 2 + inner.length };
        },
    },
    {
        label: 'I',
        description: 'In nghiêng',
        apply: (selected: string) => {
            const inner = selected || 'Nội dung nhấn nhẹ';
            return { inserted: `*${inner}*`, selectionStart: 1, selectionEnd: 1 + inner.length };
        },
    },
    {
        label: 'Quote',
        description: 'Trích dẫn nổi bật',
        apply: (selected: string) => {
            const inner = selected || 'Insight hoặc trích dẫn đáng nhớ.';
            return { inserted: `> ${inner}\n\n`, selectionStart: 2, selectionEnd: 2 + inner.length };
        },
    },
    {
        label: 'List',
        description: 'Danh sách bullet',
        apply: () => ({ inserted: '- Ý đầu tiên\n- Ý thứ hai\n- Ý thứ ba\n\n', selectionStart: 2, selectionEnd: 13 }),
    },
    {
        label: '1.',
        description: 'Danh sách đánh số',
        apply: () => ({ inserted: '1. Ý đầu tiên\n2. Ý tiếp theo\n3. Ý cuối cùng\n\n', selectionStart: 3, selectionEnd: 14 }),
    },
    {
        label: 'Link',
        description: 'Chèn liên kết',
        apply: (selected: string) => {
            const inner = selected || 'Tên liên kết';
            const inserted = `[${inner}](https://example.com)`;
            return { inserted, selectionStart: inner.length + 3, selectionEnd: inserted.length - 1 };
        },
    },
    {
        label: 'Code',
        description: 'Code block',
        apply: () => ({ inserted: '```ts\nconst example = true;\n```\n\n', selectionStart: 6, selectionEnd: 26 }),
    },
    {
        label: 'Checklist',
        description: 'Khối checklist cuối mục',
        apply: () => ({ inserted: '## Checklist nhanh\n\n- Việc cần làm 1\n- Việc cần làm 2\n- Việc cần làm 3\n\n', selectionStart: 3, selectionEnd: 17 }),
    },
    {
        label: 'CTA',
        description: 'Khối kêu gọi hành động',
        apply: () => ({ inserted: '## Bạn nên làm gì tiếp theo?\n\n- Hành động 1\n- Hành động 2\n- Hành động 3\n\n', selectionStart: 3, selectionEnd: 29 }),
    },
] as const;

export const AdminBlogFormModal: React.FC<AdminBlogFormModalProps> = ({ isOpen, onClose, postId, initialMode = 'edit' }) => {
    const queryClient = useQueryClient();
    const isPreviewMode = initialMode === 'preview';
    const editorRef = useRef<HTMLTextAreaElement | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: postId ? (isPreviewMode ? adminQueryKeys.postPreview(postId) : adminQueryKeys.post(postId)) : ['adminBlog', 'empty'],
        queryFn: () => isPreviewMode ? blogApi.adminPreview(postId!) : blogApi.adminGetById(postId!),
        enabled: isOpen && !!postId,
    });
    const postToEdit = data?.post;

    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [content, setContent] = useState('');
    const [tag, setTag] = useState('');
    const [coverImageUrl, setCoverImageUrl] = useState('');
    const [status, setStatus] = useState<'DRAFT' | 'SCHEDULED' | 'PUBLISHED'>('DRAFT');
    const [scheduledAt, setScheduledAt] = useState('');
    const [metaTitle, setMetaTitle] = useState('');
    const [metaDescription, setMetaDescription] = useState('');
    const [currentStep, setCurrentStep] = useState<FormStep>('content');

    const [slugStatus, setSlugStatus] = useState<'IDLE' | 'CHECKING' | 'AVAILABLE' | 'CONFLICTED'>('IDLE');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (postToEdit) {
            setTitle(postToEdit.title);
            setSlug(postToEdit.slug);
            setExcerpt(postToEdit.excerpt || '');
            setContent(postToEdit.content);
            setTag(postToEdit.tag || '');
            setCoverImageUrl(postToEdit.coverImageUrl || '');
            setStatus(postToEdit.status);
            setScheduledAt(postToEdit.scheduledAt ? new Date(postToEdit.scheduledAt).toISOString().slice(0, 16) : '');
            setMetaTitle(postToEdit.metaTitle || '');
            setMetaDescription(postToEdit.metaDescription || '');
        } else {
            setTitle('');
            setSlug('');
            setExcerpt('');
            setContent('');
            setTag('');
            setCoverImageUrl('');
            setStatus('DRAFT');
            setScheduledAt('');
            setMetaTitle('');
            setMetaDescription('');
        }
        setCurrentStep('content');
        setSlugStatus('IDLE');
        setErrorMessage(null);
    }, [postToEdit, isOpen]);

    const checkSlugMutation = useMutation({
        mutationFn: (slugToCheck: string) => blogApi.adminCheckSlug({ slug: slugToCheck, excludeId: postToEdit?.id }),
        onSuccess: (response) => {
            setSlugStatus(response.isAvailable ? 'AVAILABLE' : 'CONFLICTED');
        }
    });

    const handleCheckSlug = () => {
        if (!slug.trim() || isPreviewMode) return;
        setSlugStatus('CHECKING');
        checkSlugMutation.mutate(slug);
    };

    const saveMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                title,
                slug,
                excerpt,
                content,
                tag,
                coverImageUrl,
                status,
                scheduledAt: status === 'SCHEDULED' && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
                metaTitle,
                metaDescription,
            };

            if (postToEdit) {
                return blogApi.adminUpdate(postToEdit.id, payload);
            }

            return blogApi.adminCreate(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.postsRoot });
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.blogStats });
            if (postId) {
                queryClient.invalidateQueries({ queryKey: adminQueryKeys.post(postId) });
            }
            setErrorMessage(null);
            onClose();
        },
        onError: (err: Error) => setErrorMessage(err.message || 'Lưu bài viết thất bại')
    });

    const uploadMutation = useMutation({
        mutationFn: ({ file }: { file: File; target: UploadTarget }) => blogApi.uploadImage(file),
        onSuccess: (response, variables) => {
            if (variables.target === 'cover') {
                setCoverImageUrl(response.url);
            }
            if (variables.target === 'inline') {
                insertImageSnippet(response.url);
            }
            setErrorMessage(null);
        },
        onError: (err: Error) => setErrorMessage(err.message || 'Tải ảnh thất bại')
    });

    const focusEditor = (selectionStart: number, selectionEnd = selectionStart) => {
        requestAnimationFrame(() => {
            const textarea = editorRef.current;
            if (!textarea) return;
            textarea.focus();
            textarea.setSelectionRange(selectionStart, selectionEnd);
        });
    };

    const replaceEditorSelection = (builder: (selectedText: string) => { inserted: string; selectionStart: number; selectionEnd: number }) => {
        if (isPreviewMode) return;

        const textarea = editorRef.current;
        const selectionStart = textarea?.selectionStart ?? content.length;
        const selectionEnd = textarea?.selectionEnd ?? content.length;
        const selectedText = content.slice(selectionStart, selectionEnd);
        const nextPiece = builder(selectedText);

        const before = content.slice(0, selectionStart);
        const after = content.slice(selectionEnd);
        const nextContent = `${before}${nextPiece.inserted}${after}`;

        setContent(nextContent);
        focusEditor(before.length + nextPiece.selectionStart, before.length + nextPiece.selectionEnd);
    };

    const insertImageSnippet = (imageUrl: string) => {
        replaceEditorSelection(() => {
            const inserted = `![Mô tả ảnh](${imageUrl} "Chú thích ảnh")\n\n`;
            return { inserted, selectionStart: 2, selectionEnd: 11 };
        });
    };

    const handleToolbarInsert = (template: (typeof EDITOR_TEMPLATES)[number]) => {
        replaceEditorSelection((selectedText) => template.apply(selectedText));
    };

    const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>, target: UploadTarget) => {
        if (isPreviewMode) return;
        if (e.target.files && e.target.files[0]) {
            uploadMutation.mutate({ file: e.target.files[0], target });
        }
        e.target.value = '';
    };

    if (!isOpen) return null;

    const handleClose = () => {
        setErrorMessage(null);
        onClose();
    };

    const stepIndex = FORM_STEPS.findIndex(step => step.key === currentStep);
    const currentStepConfig = FORM_STEPS[stepIndex];
    const isFirstStep = stepIndex === 0;
    const isLastStep = stepIndex === FORM_STEPS.length - 1;

    const goToStep = (step: FormStep) => {
        setCurrentStep(step);
    };

    const goToPreviousStep = () => {
        if (isFirstStep) return;
        setCurrentStep(FORM_STEPS[stepIndex - 1].key);
    };

    const goToNextStep = () => {
        if (isLastStep) return;
        setCurrentStep(FORM_STEPS[stepIndex + 1].key);
    };

    const contentStepInvalid = !title.trim() || !content.trim();
    const publishingStepInvalid = status === 'SCHEDULED' && !scheduledAt;
    const saveDisabled = saveMutation.isPending || slugStatus === 'CONFLICTED' || contentStepInvalid || publishingStepInvalid;

    const renderStepContent = () => {
        if (currentStep === 'content') {
            return (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                    <div className="flex min-h-[560px] flex-col gap-5 rounded-[28px] border bg-card/70 p-5 shadow-sm">
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tiêu đề chính</label>
                                <input
                                    type="text"
                                    placeholder="Nhập tiêu đề bài viết..."
                                    className="bg-background border-2 border-secondary rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-primary"
                                    value={title}
                                    onChange={e => {
                                        if (isPreviewMode) return;
                                        const newTitle = e.target.value;
                                        setTitle(newTitle);
                                        if (!postToEdit && newTitle) {
                                            setSlug(generateSlug(newTitle));
                                            setSlugStatus('IDLE');
                                        } else if (!postToEdit && !newTitle) {
                                            setSlug('');
                                            setSlugStatus('IDLE');
                                        }
                                    }}
                                    disabled={isPreviewMode}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between gap-3">
                                    Đường dẫn (Slug)
                                    <button
                                        type="button"
                                        onClick={handleCheckSlug}
                                        disabled={isPreviewMode || checkSlugMutation.isPending || !slug}
                                        className="text-[10px] bg-secondary px-2 py-1 rounded flex items-center gap-1 hover:bg-primary hover:text-white disabled:opacity-50"
                                    >
                                        <Search className="w-3 h-3" /> Kiểm tra khả dụng
                                    </button>
                                </label>
                                <input
                                    type="text"
                                    placeholder="vd: lo-trinh-hoc-frontend"
                                    className={`bg-background border-2 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none ${slugStatus === 'AVAILABLE' ? 'border-emerald-500' : slugStatus === 'CONFLICTED' ? 'border-destructive' : 'border-secondary focus:border-primary'}`}
                                    value={slug}
                                    onChange={e => { if (isPreviewMode) return; setSlug(e.target.value); setSlugStatus('IDLE'); }}
                                    disabled={isPreviewMode}
                                />
                                {slugStatus === 'AVAILABLE' && <span className="text-[10px] font-bold text-emerald-500">Đường dẫn này hợp lệ.</span>}
                                {slugStatus === 'CONFLICTED' && <span className="text-[10px] font-bold text-destructive">Đường dẫn đã tồn tại, vui lòng đổi.</span>}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mô tả ngắn (Excerpt)</label>
                            <textarea
                                rows={3}
                                className="bg-background border-2 border-secondary rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none custom-scrollbar"
                                value={excerpt}
                                onChange={e => { if (isPreviewMode) return; setExcerpt(e.target.value); }}
                                disabled={isPreviewMode}
                            />
                        </div>

                        <div className="flex items-start justify-between gap-4 rounded-2xl border bg-background px-4 py-3">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Thanh công cụ format</div>
                                <div className="mt-1 text-sm text-muted-foreground">Chèn nhanh cấu trúc bài viết đẹp mà không cần nhớ toàn bộ cú pháp.</div>
                            </div>
                            <label className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] ${isPreviewMode ? 'cursor-default border-border bg-secondary text-muted-foreground' : 'cursor-pointer border-primary/30 bg-primary/10 text-primary hover:bg-primary/20'}`}>
                                <span className="inline-flex items-center gap-2">
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    {uploadMutation.isPending ? 'Đang tải ảnh...' : 'Thêm ảnh vào nội dung'}
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={isPreviewMode || uploadMutation.isPending}
                                    onChange={(event) => handleUploadImage(event, 'inline')}
                                />
                            </label>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {EDITOR_TEMPLATES.map((template) => (
                                <button
                                    key={template.label}
                                    type="button"
                                    onClick={() => handleToolbarInsert(template)}
                                    disabled={isPreviewMode}
                                    title={template.description}
                                    className="rounded-full border bg-background px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {template.label}
                                </button>
                            ))}
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                            <div className="flex flex-col gap-2 min-h-[320px]">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    {isPreviewMode ? 'Nội dung render từ backend' : 'Nội dung bài viết'}
                                </label>
                                {isPreviewMode ? (
                                    <div className="flex-1 overflow-y-auto rounded-2xl border-2 border-secondary bg-secondary/10 p-5 custom-scrollbar">
                                        <BlogContentRenderer content={content} />
                                    </div>
                                ) : (
                                    <textarea
                                        ref={editorRef}
                                        className="flex-1 resize-none rounded-2xl border-2 border-secondary bg-secondary/10 px-4 py-4 text-sm leading-7 font-mono focus:outline-none focus:border-primary custom-scrollbar"
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                        placeholder={`## Mở bài hấp dẫn\n\nViết 2-3 đoạn mở đầu để dẫn dắt người đọc.\n\n### Ý chính\n\n- Ý quan trọng đầu tiên\n- Ý quan trọng thứ hai\n\n> Lưu ý hoặc insight nổi bật.\n\n\`\`\`ts\nconst example = true;\n\`\`\`\n`}
                                    />
                                )}
                            </div>

                            <div className="rounded-[24px] border bg-secondary/15 p-4">
                                <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Bố cục gợi ý</div>
                                <div className="mt-4 space-y-3 text-sm">
                                    <div className="rounded-2xl border bg-background p-3">
                                        <div className="font-bold text-foreground">1. Mở bài</div>
                                        <div className="mt-1 text-muted-foreground">Nêu vấn đề, bối cảnh, ai nên đọc bài này.</div>
                                    </div>
                                    <div className="rounded-2xl border bg-background p-3">
                                        <div className="font-bold text-foreground">2. Triển khai theo mục</div>
                                        <div className="mt-1 text-muted-foreground">Dùng H2/H3, bullet list và quote để chia nhịp đọc.</div>
                                    </div>
                                    <div className="rounded-2xl border bg-background p-3">
                                        <div className="font-bold text-foreground">3. Kết bài rõ ràng</div>
                                        <div className="mt-1 text-muted-foreground">Chốt insight, checklist hoặc CTA để bài có điểm nhớ.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex min-h-[560px] flex-col gap-5 rounded-[28px] border bg-secondary/15 p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Xem trước live</div>
                                <div className="mt-1 text-sm text-muted-foreground">Preview dùng cùng renderer với trang public.</div>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                                <Eye className="w-3.5 h-3.5" /> Article preview
                            </div>
                        </div>

                        <div className="rounded-[28px] border bg-background p-5 shadow-sm">
                            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                {tag ? <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{tag}</span> : null}
                                <span>{BLOG_STATUS_LABEL[status]}</span>
                            </div>
                            <h3 className="mt-4 text-2xl font-black tracking-tight text-foreground">
                                {title || 'Tiêu đề bài viết sẽ hiển thị tại đây'}
                            </h3>
                            <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                {excerpt || 'Mô tả ngắn giúp người viết kiểm tra nhanh giọng điệu và phần dẫn nhập.'}
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto rounded-[28px] border bg-background p-5 custom-scrollbar">
                            <BlogContentRenderer content={content} />
                        </div>
                    </div>
                </div>
            );
        }

        if (currentStep === 'publishing') {
            return (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
                    <div className="flex flex-col gap-6 rounded-[28px] border bg-card/70 p-5 shadow-sm">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Trạng thái xuất bản</label>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                                <select className="bg-background border-2 border-secondary rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-primary" value={status} onChange={e => { if (isPreviewMode) return; setStatus(e.target.value as 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'); }} disabled={isPreviewMode}>
                                    <option value="DRAFT">{BLOG_STATUS_LABEL.DRAFT}</option>
                                    <option value="SCHEDULED">{BLOG_STATUS_LABEL.SCHEDULED}</option>
                                    <option value="PUBLISHED">{BLOG_STATUS_LABEL.PUBLISHED}</option>
                                </select>
                                {status === 'SCHEDULED' && (
                                    <div className="flex items-center gap-2 rounded-xl border-2 border-primary/20 bg-primary/5 px-4 py-3 font-mono text-sm">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        <input type="datetime-local" className="bg-transparent focus:outline-none" value={scheduledAt} onChange={e => { if (isPreviewMode) return; setScheduledAt(e.target.value); }} disabled={isPreviewMode} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ảnh cover URL</label>
                                <input type="text" placeholder="https://..." className="bg-background border-2 border-secondary rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" value={coverImageUrl} onChange={e => { if (isPreviewMode) return; setCoverImageUrl(e.target.value); }} disabled={isPreviewMode} />
                            </div>
                            <div className="flex flex-col justify-end gap-2">
                                <label className={`rounded-xl border px-4 py-3 text-xs font-bold uppercase flex items-center justify-center gap-2 ${isPreviewMode ? 'cursor-default border-border bg-secondary text-muted-foreground' : 'cursor-pointer border-primary/20 bg-primary/10 text-primary hover:bg-primary/20'}`}>
                                    {uploadMutation.isPending ? 'Đang tải...' : isPreviewMode ? <><Eye className="w-4 h-4" /> Chế độ xem trước</> : <><ImageIcon className="w-4 h-4" /> Tải lên ảnh cover</>}
                                    <input type="file" accept="image/*" className="hidden" onChange={(event) => handleUploadImage(event, 'cover')} disabled={isPreviewMode || uploadMutation.isPending} />
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phân loại thẻ (Tag)</label>
                            <input type="text" placeholder="vd: AI, Frontend, Career" className="bg-background border-2 border-secondary rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-primary" value={tag} onChange={e => { if (isPreviewMode) return; setTag(e.target.value); }} disabled={isPreviewMode} />
                        </div>
                    </div>

                    <div className="rounded-[28px] border bg-secondary/15 p-5 shadow-sm">
                        <div className="space-y-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tóm tắt xuất bản</span>
                            <div className="rounded-3xl border bg-background p-5 space-y-4">
                                <div>
                                    <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Trạng thái</div>
                                    <div className="mt-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                                        {BLOG_STATUS_LABEL[status]}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Ảnh cover</div>
                                    <div className="mt-2 text-sm text-muted-foreground break-all">{coverImageUrl || 'Chưa có ảnh cover.'}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Tag</div>
                                    <div className="mt-2 text-sm text-muted-foreground">{tag || 'Chưa gắn tag.'}</div>
                                </div>
                                {status === 'SCHEDULED' && (
                                    <div className={`rounded-2xl border px-4 py-3 ${scheduledAt ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600' : 'border-amber-500/30 bg-amber-500/10 text-amber-600'}`}>
                                        <div className="font-bold text-sm">Lịch đăng bài</div>
                                        <div className="text-xs mt-1">{scheduledAt ? 'Đã chọn thời điểm đăng bài.' : 'Bạn cần chọn thời điểm nếu muốn lên lịch.'}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
                <div className="rounded-[28px] border bg-card/70 p-5 shadow-sm space-y-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Meta Title</label>
                        <input type="text" className="bg-background border-2 border-secondary rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" value={metaTitle} onChange={e => { if (isPreviewMode) return; setMetaTitle(e.target.value); }} disabled={isPreviewMode} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Meta Description</label>
                        <textarea rows={5} className="bg-background border-2 border-secondary rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none custom-scrollbar" value={metaDescription} onChange={e => { if (isPreviewMode) return; setMetaDescription(e.target.value); }} disabled={isPreviewMode} />
                    </div>
                </div>

                <div className="rounded-[28px] border bg-secondary/15 p-5 shadow-sm">
                    <div className="space-y-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Xem nhanh trước khi lưu</span>
                        <div className="rounded-3xl border bg-background p-5 space-y-4">
                            <div>
                                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Tiêu đề</div>
                                <div className="mt-2 text-base font-bold">{metaTitle || title || 'Chưa có tiêu đề hiển thị.'}</div>
                            </div>
                            <div>
                                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Mô tả</div>
                                <div className="mt-2 text-sm text-muted-foreground">{metaDescription || excerpt || 'Chưa có mô tả để hiển thị trên công cụ tìm kiếm.'}</div>
                            </div>
                            <div>
                                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">URL</div>
                                <div className="mt-2 font-mono text-xs text-primary break-all">/{slug || 'duong-dan-bai-viet'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const modal = (
        <div className="fixed inset-0 z-[120] bg-background/80 backdrop-blur-sm">
            <div className="flex min-h-screen items-center justify-center p-4 lg:p-6">
                <div className="relative flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[32px] border bg-card shadow-2xl">
                    <div className="flex items-start justify-between gap-4 border-b bg-background px-6 py-5 shrink-0">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black">{isPreviewMode ? 'Xem trước bài viết' : postToEdit ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}</h2>
                            <p className="text-sm font-medium text-muted-foreground">{isPreviewMode ? 'Kiểm tra nội dung render từ backend trước khi xuất bản.' : postToEdit ? 'Cập nhật nội dung hiện tại theo từng bước ngắn và có preview live.' : 'Tạo bài viết mới với công cụ format và preview trực tiếp.'}</p>
                        </div>
                        <button onClick={handleClose} className="p-2 bg-secondary rounded-full hover:bg-secondary/70 transition-colors"><X className="w-5 h-5" /></button>
                    </div>

                    {errorMessage ? (
                        <div className="border-b border-destructive/20 bg-destructive/5 px-6 py-3 text-sm font-medium text-destructive">
                            {errorMessage}
                        </div>
                    ) : null}

                    <div className="border-b bg-secondary/10 px-6 py-4 shrink-0">
                        <div className="grid gap-3 md:grid-cols-3">
                            {FORM_STEPS.map((step, index) => {
                                const isActive = step.key === currentStep;
                                const isCompleted = index < stepIndex;

                                return (
                                    <button
                                        key={step.key}
                                        type="button"
                                        onClick={() => goToStep(step.key)}
                                        className={`rounded-2xl border px-4 py-3 text-left transition-all ${isActive ? 'border-primary bg-primary/10 shadow-sm' : isCompleted ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-border bg-background hover:bg-secondary'}`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Bước {index + 1}</span>
                                            {isCompleted ? <span className="text-[10px] font-bold text-emerald-600">Xong</span> : null}
                                        </div>
                                        <div className="mt-2 text-sm font-bold">{step.label}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">{step.helper}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-surface/20 px-6 py-6 custom-scrollbar">
                        {isLoading && (
                            <div className="flex min-h-[420px] items-center justify-center">
                                <Loader />
                            </div>
                        )}

                        {!isLoading && postId && !postToEdit && (
                            <div className="flex min-h-[420px] items-center justify-center text-sm font-medium text-muted-foreground">
                                Không thể tải chi tiết bài viết.
                            </div>
                        )}

                        {!isLoading && (!postId || postToEdit) && renderStepContent()}
                    </div>

                    <div className="border-t bg-background px-6 py-4 shrink-0">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Đang chỉnh</div>
                                <div className="text-sm font-medium text-foreground">{currentStepConfig.label}</div>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-3">
                                {!isPreviewMode ? (
                                    <button onClick={goToPreviousStep} disabled={isFirstStep} className="px-4 py-2.5 rounded-xl font-bold bg-secondary hover:bg-secondary/70 transition-colors disabled:opacity-50 disabled:hover:bg-secondary flex items-center gap-2">
                                        <ChevronLeft className="w-4 h-4" /> Bước trước
                                    </button>
                                ) : null}
                                {!isPreviewMode && !isLastStep ? (
                                    <button
                                        onClick={goToNextStep}
                                        disabled={(currentStep === 'content' && contentStepInvalid) || (currentStep === 'publishing' && publishingStepInvalid)}
                                        className="px-4 py-2.5 rounded-xl font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        Bước tiếp <ChevronRight className="w-4 h-4" />
                                    </button>
                                ) : null}
                                <button onClick={handleClose} className="px-6 py-2.5 rounded-xl font-bold bg-secondary hover:bg-secondary/70 transition-colors">{isPreviewMode ? 'Đóng xem trước' : 'Hủy bỏ'}</button>
                                {!isPreviewMode ? (
                                    <button
                                        disabled={saveDisabled}
                                        onClick={() => saveMutation.mutate()}
                                        className="px-6 py-2.5 rounded-xl font-bold bg-primary text-primary-foreground flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
                                    >
                                        {saveMutation.isPending ? 'Đang lưu...' : <><Save className="w-4 h-4" /> Lưu bài viết</>}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
};
