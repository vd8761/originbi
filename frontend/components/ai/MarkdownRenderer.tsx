'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  hideSingleBullet?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, hideSingleBullet }) => {
  return (
    <div className="min-w-0 break-words text-[15px] leading-relaxed text-[#374151] dark:text-[#d1d5db]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-6 mb-3 pb-2 border-b border-[#e5e7eb] dark:border-[#2d2d2d] text-[#111827] dark:text-[#f9fafb]" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-[17px] font-semibold mt-5 mb-2 text-[#111827] dark:text-[#f9fafb]" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-[15px] font-semibold mt-4 mb-1.5 text-[#111827] dark:text-[#f9fafb]" {...props} />,
          h4: ({node, ...props}) => <h4 className="text-[14px] font-semibold mt-3 mb-1 text-[#111827] dark:text-[#f9fafb]" {...props} />,
          p: ({node, ...props}) => <p className="my-2" {...props} />,
          ul: ({node, children, ...props}) => {
            // Count real li children (ignore whitespace text nodes)
            if (hideSingleBullet) {
              const liChildren = React.Children.toArray(children).filter(
                (c): c is React.ReactElement => React.isValidElement(c) && (c as React.ReactElement<any>).type === 'li'
              );
              if (liChildren.length === 1) {
                // Render the single item as a plain paragraph — no bullet, no indent
                return <p className="my-2">{(liChildren[0] as React.ReactElement<any>).props.children}</p>;
              }
            }
            return <ul className="my-2 space-y-1.5 pl-6 list-disc list-outside" {...props}>{children}</ul>;
          },
          ol: ({node, ...props}) => <ol className="my-2 space-y-1.5 pl-6 list-decimal list-outside" {...props} />,
          li: ({node, ...props}) => <li className="pl-1" {...props} />,
          table: ({node, ...props}) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-[#e5e7eb] dark:border-[#2d2d2d] shadow-sm">
              <table className="min-w-full text-sm" {...props} />
            </div>
          ),
          thead: ({node, ...props}) => <thead className="bg-[#f9fafb] dark:bg-[#1e1e1e] border-b border-[#e5e7eb] dark:border-[#2d2d2d]" {...props} />,
          th: ({node, ...props}) => <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6b7280] dark:text-[#9ca3af] uppercase tracking-wider" {...props} />,
          tbody: ({node, ...props}) => <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d2d2d]" {...props} />,
          td: ({node, ...props}) => <td className="px-4 py-2.5 whitespace-normal" {...props} />,
          tr: ({node, ...props}) => <tr className="hover:bg-[#f9fafb] dark:hover:bg-[#1e1e1e] transition-colors" {...props} />,
          code: ({node, className, children, ...props}: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !className;
            if (isInline) {
              return <code className="bg-[#f3f4f6] dark:bg-[#2d2d2d] text-[#c7254e] dark:text-[#e06c75] px-[5px] py-[2px] rounded text-[0.85em] font-mono" {...props}>{children}</code>;
            }
            return (
              <div className="my-4 rounded-xl overflow-hidden border border-[#e5e7eb] dark:border-[#2d2d2d]">
                <div className="bg-[#f3f4f6] dark:bg-[#1e1e1e] px-4 py-1.5 text-[11px] font-mono text-[#6b7280] dark:text-[#9ca3af] border-b border-[#e5e7eb] dark:border-[#2d2d2d]">
                  {match ? match[1] : 'code'}
                </div>
                <pre className="bg-[#f8f8f8] dark:bg-[#141414] p-4 text-sm font-mono overflow-x-auto whitespace-pre leading-relaxed">
                  <code className={className} {...props}>{children}</code>
                </pre>
              </div>
            );
          },
          a: ({node, ...props}) => <a className="text-blue-600 hover:underline dark:text-blue-400" target="_blank" rel="noopener noreferrer" {...props} />,
          strong: ({node, ...props}) => <strong className="font-semibold text-[#111827] dark:text-[#f9fafb]" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
