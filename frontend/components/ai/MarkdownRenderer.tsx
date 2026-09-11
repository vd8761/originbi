'use client';

import React, { useState } from 'react';

interface MarkdownRendererProps {
  content: string;
  hideSingleBullet?: boolean;
}

// Inline parser: bold, italic, inline code, links
function parseInline(text: string): React.ReactNode[] {
  // Strip leading bullet chars that may slip through
  const cleaned = text.replace(/^[•·]\s*/, '');

  // Split on bold (**...**), italic (*...*), inline code (`...`), badge markers
  const parts = cleaned.split(/(\*\*[\s\S]*?\*\*|\*[\s\S]*?\*|`[^`]+`|\[Badge:[^\]]+\])/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-[#f3f4f6] dark:bg-[#2d2d2d] text-[#c7254e] dark:text-[#e06c75] px-[5px] py-[2px] rounded text-[0.85em] font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('[Badge:') && part.endsWith(']')) {
      const label = part.slice(7, -1).trim();
      let cls = 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      if (/high|critical/i.test(label)) cls = 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      else if (/medium/i.test(label)) cls = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';
      else if (/low|success/i.test(label)) cls = 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
      return <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>{label}</span>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, hideSingleBullet = false }) => {
  const parseMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    let bulletItems: string[] = [];
    let orderedItems: string[] = [];
    let orderedStart = 1;
    let inCodeBlock = false;
    let codeBlockLang = '';
    let codeLines: string[] = [];

    const flushTable = () => {
      if (!inTable || tableHeaders.length === 0) return;
      elements.push(
        <div key={`table-${elements.length}`} className="overflow-x-auto my-4 rounded-xl border border-[#e5e7eb] dark:border-[#2d2d2d] shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#f9fafb] dark:bg-[#1e1e1e] border-b border-[#e5e7eb] dark:border-[#2d2d2d]">
                {tableHeaders.map((h, i) => (
                  <th key={i} className="px-4 py-2.5 text-left text-xs font-semibold text-[#6b7280] dark:text-[#9ca3af] uppercase tracking-wider">{parseInline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d2d2d]">
              {tableRows.map((row, ri) => (
                <tr key={ri} className="hover:bg-[#f9fafb] dark:hover:bg-[#1e1e1e] transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-2.5 text-[#374151] dark:text-[#d1d5db] whitespace-normal">{parseInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableHeaders = [];
      tableRows = [];
    };

    const flushBullets = () => {
      if (bulletItems.length === 0) return;
      if (bulletItems.length === 1 && hideSingleBullet) {
        elements.push(
          <p key={`ul-single-${elements.length}`} className="my-1 pl-5 text-[15px] leading-[1.75] text-[#374151] dark:text-[#d1d5db]">
            {parseInline(bulletItems[0])}
          </p>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-2 space-y-1.5 pl-5 list-none">
            {bulletItems.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-[#374151] dark:text-[#d1d5db]">
                <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#374151] dark:bg-[#9ca3af] shrink-0" />
                <span>{parseInline(item)}</span>
              </li>
            ))}
          </ul>
        );
      }
      bulletItems = [];
    };

    const flushOrdered = () => {
      if (orderedItems.length === 0) return;
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-2 space-y-1.5 pl-5 list-none" start={orderedStart}>
          {orderedItems.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-[#374151] dark:text-[#d1d5db]">
              <span className="shrink-0 font-medium text-[#374151] dark:text-[#9ca3af] min-w-[1.25rem] text-right">{orderedStart + i}.</span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      orderedItems = [];
    };

    const flushCode = () => {
      if (codeLines.length === 0) return;
      elements.push(
        <div key={`code-${elements.length}`} className="my-4 rounded-xl overflow-hidden border border-[#e5e7eb] dark:border-[#2d2d2d]">
          {codeBlockLang && (
            <div className="bg-[#f3f4f6] dark:bg-[#1e1e1e] px-4 py-1.5 text-[11px] font-mono text-[#6b7280] dark:text-[#9ca3af] border-b border-[#e5e7eb] dark:border-[#2d2d2d]">
              {codeBlockLang}
            </div>
          )}
          <pre className="bg-[#f8f8f8] dark:bg-[#141414] p-4 text-sm font-mono text-[#374151] dark:text-[#d1d5db] overflow-x-auto whitespace-pre leading-relaxed">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      codeLines = [];
      codeBlockLang = '';
      inCodeBlock = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const line = raw.trim();

      // Code block toggle
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          flushBullets();
          flushOrdered();
          flushTable();
          inCodeBlock = true;
          codeBlockLang = line.slice(3).trim();
        } else {
          flushCode();
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(raw);
        continue;
      }

      // Table rows
      if (line.startsWith('|') && line.endsWith('|')) {
        flushBullets();
        flushOrdered();
        const cells = line.split('|').slice(1, -1).map(c => c.trim());
        if (cells.every(c => /^[-:]+$/.test(c))) continue; // separator row
        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
        } else {
          tableRows.push(cells);
        }
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Headings
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        flushBullets();
        flushOrdered();
        const level = headingMatch[1].length;
        const headingText = headingMatch[2];
        const sizeMap: Record<number, string> = {
          1: 'text-xl font-bold mt-6 mb-3 pb-2 border-b border-[#e5e7eb] dark:border-[#2d2d2d]',
          2: 'text-[17px] font-semibold mt-5 mb-2',
          3: 'text-[15px] font-semibold mt-4 mb-1.5',
          4: 'text-[14px] font-semibold mt-3 mb-1',
          5: 'text-[13px] font-medium mt-2',
          6: 'text-[12px] font-medium mt-2',
        };
        const cls = sizeMap[level] || 'text-base font-bold';
        const Tag = `h${level}` as keyof JSX.IntrinsicElements;
        elements.push(
          <Tag key={`h-${i}`} className={`${cls} text-[#111827] dark:text-[#f9fafb]`}>
            {parseInline(headingText)}
          </Tag>
        );
        continue;
      }

      // Horizontal rule
      if (/^(━{2,}|─{2,}|-{3,}|\*{3,}|_{3,})$/.test(line)) {
        flushBullets();
        flushOrdered();
        elements.push(<hr key={`hr-${i}`} className="my-4 border-[#e5e7eb] dark:border-[#2d2d2d]" />);
        continue;
      }

      // Ordered list: "1. ", "2. ", etc
      const orderedMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (orderedMatch) {
        flushBullets();
        if (orderedItems.length === 0) orderedStart = parseInt(orderedMatch[1], 10);
        orderedItems.push(orderedMatch[2]);
        continue;
      } else if (orderedItems.length > 0) {
        flushOrdered();
      }

      // Bullet list
      const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
      if (bulletMatch) {
        flushOrdered();
        bulletItems.push(bulletMatch[1]);
        continue;
      } else if (bulletItems.length > 0) {
        flushBullets();
      }

      // Empty line = spacing
      if (line === '') {
        elements.push(<div key={`sp-${i}`} className="h-2" />);
        continue;
      }

      // Paragraph
      elements.push(
        <p key={`p-${i}`} className="text-[15px] leading-[1.75] text-[#374151] dark:text-[#d1d5db] my-1">
          {parseInline(line)}
        </p>
      );
    }

    flushTable();
    flushBullets();
    flushOrdered();
    if (inCodeBlock) flushCode();

    return elements;
  };

  return (
    <div className="min-w-0 break-words">
      {parseMarkdown(content)}
    </div>
  );
};

export default MarkdownRenderer;
