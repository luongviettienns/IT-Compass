import { memo, useMemo } from 'react';
import { toApiAssetUrl } from '../../lib/authApi';
import { cn } from '../../lib/utils';

type BlogContentRendererProps = {
    content: string;
    className?: string;
};

const HTML_BLOCK_TAG_PATTERN = /^<\/?(?:a|article|aside|blockquote|br|code|div|em|figcaption|figure|h[1-6]|hr|img|li|ol|p|pre|section|strong|table|tbody|td|th|thead|tr|ul)\b/i;
const FORBIDDEN_TAGS = 'script,style,iframe,object,embed,link,meta,base,form,input,button,textarea,select,option';

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const hasUnsafeProtocol = (value: string) => /^\s*(?:javascript|vbscript|data|file):/i.test(value);

const isSafeHref = (value: string) => !hasUnsafeProtocol(value);

const isSafeImageSrc = (value: string) => {
    const normalized = toApiAssetUrl(value) ?? value;
    return !hasUnsafeProtocol(normalized);
};

const inlineMarkdownToHtml = (value: string) => {
    let html = escapeHtml(value);

    html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g, (_match, alt, src, title) => {
        const normalizedSrc = toApiAssetUrl(src) ?? src;
        const safeAlt = escapeHtml(alt || '');
        const safeTitle = title ? ` title="${escapeHtml(title)}"` : '';

        if (!isSafeImageSrc(normalizedSrc)) {
            return safeAlt;
        }

        return `<figure><img src="${escapeHtml(normalizedSrc)}" alt="${safeAlt}"${safeTitle} loading="lazy" />${safeAlt ? `<figcaption>${safeAlt}</figcaption>` : ''}</figure>`;
    });

    html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label, href) => {
        const safeLabel = escapeHtml(label);

        if (!isSafeHref(href)) {
            return safeLabel;
        }

        return `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer noopener">${safeLabel}</a>`;
    });

    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    html = html.replace(/(^|\W)\*([^*]+)\*(?=\W|$)/g, '$1<em>$2</em>');
    html = html.replace(/(^|\W)_([^_]+)_(?=\W|$)/g, '$1<em>$2</em>');

    return html;
};

const sanitizeHtml = (html: string) => {
    if (typeof window === 'undefined') {
        return html;
    }

    const parser = new DOMParser();
    const documentFragment = parser.parseFromString(html, 'text/html');

    documentFragment.querySelectorAll(FORBIDDEN_TAGS).forEach((element) => element.remove());

    documentFragment.body.querySelectorAll('*').forEach((element) => {
        Array.from(element.attributes).forEach((attribute) => {
            const attributeName = attribute.name.toLowerCase();
            const attributeValue = attribute.value;

            if (attributeName.startsWith('on') || attributeName === 'style') {
                element.removeAttribute(attribute.name);
                return;
            }

            if (attributeName === 'href') {
                if (!isSafeHref(attributeValue)) {
                    element.removeAttribute(attribute.name);
                }
                return;
            }

            if (attributeName === 'src') {
                const normalizedSrc = toApiAssetUrl(attributeValue) ?? attributeValue;
                if (!isSafeImageSrc(normalizedSrc)) {
                    element.removeAttribute(attribute.name);
                    return;
                }
                element.setAttribute(attribute.name, normalizedSrc);
            }
        });

        if (element.tagName === 'A') {
            if (element.getAttribute('target') === '_blank') {
                element.setAttribute('rel', 'noreferrer noopener');
            }
        }

        if (element.tagName === 'IMG') {
            element.setAttribute('loading', 'lazy');
        }
    });

    return documentFragment.body.innerHTML;
};

const markdownToHtml = (value: string) => {
    const lines = value.replace(/\r\n/g, '\n').split('\n');
    const html: string[] = [];
    let paragraph: string[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let blockquote: string[] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];

    const flushParagraph = () => {
        if (!paragraph.length) return;
        html.push(`<p>${inlineMarkdownToHtml(paragraph.join(' '))}</p>`);
        paragraph = [];
    };

    const flushList = () => {
        if (!listType) return;
        html.push(`</${listType}>`);
        listType = null;
    };

    const flushQuote = () => {
        if (!blockquote.length) return;
        html.push(`<blockquote>${blockquote.map((line) => `<p>${inlineMarkdownToHtml(line)}</p>`).join('')}</blockquote>`);
        blockquote = [];
    };

    const flushCodeBlock = () => {
        if (!inCodeBlock) return;
        html.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
        codeBuffer = [];
        inCodeBlock = false;
    };

    for (const rawLine of lines) {
        const line = rawLine.trimEnd();
        const trimmed = line.trim();

        if (trimmed.startsWith('```')) {
            flushParagraph();
            flushList();
            flushQuote();
            if (inCodeBlock) {
                flushCodeBlock();
            } else {
                inCodeBlock = true;
                codeBuffer = [];
            }
            continue;
        }

        if (inCodeBlock) {
            codeBuffer.push(rawLine);
            continue;
        }

        if (!trimmed) {
            flushParagraph();
            flushList();
            flushQuote();
            continue;
        }

        const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
        if (headingMatch) {
            flushParagraph();
            flushList();
            flushQuote();
            const level = headingMatch[1].length;
            html.push(`<h${level}>${inlineMarkdownToHtml(headingMatch[2].trim())}</h${level}>`);
            continue;
        }

        if (trimmed === '---' || trimmed === '***') {
            flushParagraph();
            flushList();
            flushQuote();
            html.push('<hr />');
            continue;
        }

        if (trimmed.startsWith('>')) {
            flushParagraph();
            flushList();
            blockquote.push(trimmed.replace(/^>\s?/, ''));
            continue;
        }

        const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
        if (orderedMatch) {
            flushParagraph();
            flushQuote();
            if (listType !== 'ol') {
                flushList();
                listType = 'ol';
                html.push('<ol>');
            }
            html.push(`<li>${inlineMarkdownToHtml(orderedMatch[1])}</li>`);
            continue;
        }

        const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
        if (unorderedMatch) {
            flushParagraph();
            flushQuote();
            if (listType !== 'ul') {
                flushList();
                listType = 'ul';
                html.push('<ul>');
            }
            html.push(`<li>${inlineMarkdownToHtml(unorderedMatch[1])}</li>`);
            continue;
        }

        flushList();
        flushQuote();
        paragraph.push(trimmed);
    }

    flushParagraph();
    flushList();
    flushQuote();
    flushCodeBlock();

    return html.join('');
};

const looksLikeHtml = (value: string) => {
    const trimmed = value.trimStart();
    return HTML_BLOCK_TAG_PATTERN.test(trimmed);
};

const renderContent = (content: string) => {
    const normalized = content.trim();
    if (!normalized) return '';
    if (looksLikeHtml(normalized)) {
        return sanitizeHtml(normalized);
    }
    return markdownToHtml(normalized);
};

export const BlogContentRenderer = memo(function BlogContentRenderer({ content, className }: BlogContentRendererProps) {
    const html = useMemo(() => renderContent(content), [content]);

    if (!html) {
        return <div className={cn('blog-content text-sm text-muted-foreground', className)}>Chưa có nội dung để hiển thị.</div>;
    }

    return <article className={cn('blog-content', className)} dangerouslySetInnerHTML={{ __html: html }} />;
});
