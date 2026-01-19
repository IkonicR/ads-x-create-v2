/**
 * MarkdownRenderer - Styled markdown rendering for chat messages
 * Uses react-markdown with GFM support
 */
import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useThemeStyles } from './NeuComponents';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
    const { styles } = useThemeStyles();

    return (
        <Markdown
            remarkPlugins={[remarkGfm]}
            className={`markdown-content ${className}`}
            components={{
                // Headings
                h1: ({ children }) => (
                    <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-base font-semibold mb-2 mt-2 first:mt-0">{children}</h3>
                ),

                // Paragraphs
                p: ({ children }) => (
                    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                ),

                // Bold & Italic
                strong: ({ children }) => (
                    <strong className="font-bold">{children}</strong>
                ),
                em: ({ children }) => (
                    <em className="italic">{children}</em>
                ),

                // Lists
                ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-2 space-y-1 ml-1">{children}</ul>
                ),
                ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-2 space-y-1 ml-1">{children}</ol>
                ),
                li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                ),

                // Code
                code: ({ className, children, ...props }) => {
                    const isInline = !className;
                    if (isInline) {
                        return (
                            <code
                                className="px-1.5 py-0.5 rounded text-sm font-mono bg-black/10 dark:bg-white/10"
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    }
                    return (
                        <code
                            className={`block p-3 rounded-lg text-sm font-mono bg-black/10 dark:bg-white/10 overflow-x-auto mb-2 ${className}`}
                            {...props}
                        >
                            {children}
                        </code>
                    );
                },

                // Code blocks
                pre: ({ children }) => (
                    <pre className="mb-2 last:mb-0">{children}</pre>
                ),

                // Links
                a: ({ href, children }) => (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand underline hover:opacity-80 transition-opacity"
                    >
                        {children}
                    </a>
                ),

                // Blockquotes
                blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-brand/50 pl-3 italic opacity-80 mb-2">
                        {children}
                    </blockquote>
                ),

                // Horizontal rule
                hr: () => (
                    <hr className="my-3 border-current opacity-20" />
                ),
            }}
        >
            {content}
        </Markdown>
    );
};

export default MarkdownRenderer;
