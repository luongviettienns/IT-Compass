import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toApiAssetUrl } from '../../lib/authApi';
import { cn } from '../../lib/utils';

type BlogContentRendererProps = {
    content: string;
    className?: string;
};

const hasUnsafeProtocol = (value: string) => /^\s*(?:javascript|vbscript|data|file):/i.test(value);

const isSafeHref = (value: string) => !hasUnsafeProtocol(value);

const isSafeImageSrc = (value: string) => {
    const normalized = toApiAssetUrl(value) ?? value;
    return !hasUnsafeProtocol(normalized);
};

export const BlogContentRenderer = memo(function BlogContentRenderer({ content, className }: BlogContentRendererProps) {
    if (!content?.trim()) {
        return <div className={cn('blog-content text-sm text-muted-foreground', className)}>Chưa có nội dung để hiển thị.</div>;
    }

    return (
        <article className={cn('blog-content max-w-none', className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    a({ href, children, ...props }) {
                        if (href && isSafeHref(href)) {
                            return <a href={href} target="_blank" rel="noreferrer noopener" {...props}>{children}</a>;
                        }
                        return <span>{children}</span>;
                    },
                    img({ src, alt, title, ...props }) {
                        if (src) {
                            const normalizedSrc = toApiAssetUrl(src) ?? src;
                            if (isSafeImageSrc(normalizedSrc)) {
                                return (
                                    <figure className="my-8">
                                        <img src={normalizedSrc} alt={alt || ''} title={title || ''} loading="lazy" className="rounded-xl mx-auto shadow-md" {...props} />
                                        {alt && <figcaption className="text-center text-sm text-muted-foreground mt-2">{alt}</figcaption>}
                                    </figure>
                                );
                            }
                        }
                        return <span>{alt}</span>;
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </article>
    );
});
