import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // A simple custom markdown parser for basic formatting
  
  const parseMarkdown = (text: string) => {
    // Split by newlines to handle block elements
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    const flushTable = () => {
      if (inTable && tableHeaders.length > 0) {
        elements.push(
          <div key={`table-${elements.length}`} className="overflow-x-auto my-4 border rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {tableHeaders.map((header, i) => (
                    <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {parseInline(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {tableRows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {parseInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      inTable = false;
      tableHeaders = [];
      tableRows = [];
    };

    let listItems: string[] = [];
    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc pl-5 my-2 space-y-1">
            {listItems.map((item, i) => (
              <li key={i} className="text-gray-800 dark:text-gray-200 text-sm">
                {parseInline(item)}
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Handle Tables
      if (line.startsWith('|') && line.endsWith('|')) {
        flushList();
        const cells = line.split('|').slice(1, -1).map(c => c.trim());
        if (cells.every(c => c.match(/^[-:]+$/))) {
          // This is the separator line, ignore it
          continue;
        }
        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
        } else {
          tableRows.push(cells);
        }
        continue;
      } else {
        flushTable();
      }

      // Handle Headings
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        flushList();
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        const Tag = `h${level}` as keyof JSX.IntrinsicElements;
        const sizeClasses = ({
          1: 'text-xl font-bold mt-5 mb-2 border-b border-gray-200 dark:border-gray-700 pb-1',
          2: 'text-lg font-semibold mt-4 mb-2',
          3: 'text-base font-semibold mt-3 mb-1',
          4: 'text-sm font-semibold mt-2',
          5: 'text-sm font-medium mt-1',
          6: 'text-xs font-medium mt-1',
        } as Record<number, string>)[level] || 'text-base font-bold';
        
        elements.push(
          <Tag key={`h-${i}`} className={`${sizeClasses} text-gray-900 dark:text-gray-100`}>
            {parseInline(text)}
          </Tag>
        );
        continue;
      }

      // Handle Horizontal Rules (━━━, ---, ***)
      if (/^(━{2,}|─{2,}|-{3,}|\*{3,})$/.test(line)) {
        flushList();
        elements.push(<hr key={`hr-${i}`} className="my-3 border-gray-200 dark:border-gray-700" />);
        continue;
      }

      // Handle Lists: -, *, and • (strip bullet char to prevent double rendering)
      const listMatch = line.match(/^[-*•]\s*(.+)$/);
      if (listMatch) {
        listItems.push(listMatch[1]);
        continue;
      } else {
        flushList();
      }

      // Handle Paragraphs
      if (line !== '') {
        elements.push(
          <p key={`p-${i}`} className="my-1 text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
            {parseInline(line)}
          </p>
        );
      }
    }
    
    flushTable();
    flushList();

    return elements;
  };

  const parseInline = (text: string) => {
    // Strip residual leading bullet chars to prevent double rendering
    const cleaned = text.replace(/^[•·]\s*/, '');
    const parts = cleaned.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[Badge:.*?\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs text-pink-600 dark:text-pink-400 font-mono">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith('[Badge:') && part.endsWith(']')) {
        const badgeContent = part.slice(7, -1).trim();
        let colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        if (badgeContent.toLowerCase().includes('high') || badgeContent.toLowerCase().includes('critical')) {
          colorClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        } else if (badgeContent.toLowerCase().includes('medium')) {
          colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        } else if (badgeContent.toLowerCase().includes('low') || badgeContent.toLowerCase().includes('success')) {
          colorClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        }
        return (
          <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
            {badgeContent}
          </span>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  return <div className="space-y-1">{parseMarkdown(content)}</div>;
};

export default MarkdownRenderer;
