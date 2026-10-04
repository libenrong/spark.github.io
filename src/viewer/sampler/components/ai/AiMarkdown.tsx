import { ReactNode } from 'react';

function renderInline(text: string): ReactNode[] {
    const parts: ReactNode[] = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;
    let last = 0;
    let key = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > last) {
            parts.push(text.slice(last, match.index));
        }
        const token = match[0];
        if (token.startsWith('**')) {
            parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
        } else if (token.startsWith('`')) {
            parts.push(<code key={key++}>{token.slice(1, -1)}</code>);
        } else {
            parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
        }
        last = match.index + token.length;
    }
    if (last < text.length) {
        parts.push(text.slice(last));
    }
    return parts;
}

const HEADING = /^(#{1,4})\s+(.*)$/;
const UNORDERED = /^\s*[-*+]\s+(.*)$/;
const ORDERED = /^\s*\d+\.\s+(.*)$/;
const QUOTE = /^\s*>\s?(.*)$/;
const FENCE = /^\s*```/;

/**
 * Minimal markdown renderer for the AI output (headings, lists,
 * blockquotes, code fences, bold/italic/inline code).
 */
export default function AiMarkdown({ text }: { text: string }) {
    const lines = text.split('\n');
    const blocks: ReactNode[] = [];
    let key = 0;
    let paragraph: string[] = [];

    const flushParagraph = () => {
        if (!paragraph.length) return;
        blocks.push(<p key={key++}>{renderInline(paragraph.join('\n'))}</p>);
        paragraph = [];
    };

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];

        if (FENCE.test(line)) {
            flushParagraph();
            const code: string[] = [];
            i++;
            while (i < lines.length && !FENCE.test(lines[i])) {
                code.push(lines[i]);
                i++;
            }
            i++; // skip closing fence (or run past the end)
            blocks.push(
                <pre key={key++}>
                    <code>{code.join('\n')}</code>
                </pre>
            );
            continue;
        }

        const heading = line.match(HEADING);
        if (heading) {
            flushParagraph();
            const level = heading[1].length;
            const content = renderInline(heading[2].trim());
            if (level === 1) blocks.push(<h2 key={key++}>{content}</h2>);
            else if (level === 2) blocks.push(<h3 key={key++}>{content}</h3>);
            else blocks.push(<h4 key={key++}>{content}</h4>);
            i++;
            continue;
        }

        if (UNORDERED.test(line)) {
            flushParagraph();
            const items: ReactNode[] = [];
            while (i < lines.length && UNORDERED.test(lines[i])) {
                const m = lines[i].match(UNORDERED)!;
                items.push(<li key={items.length}>{renderInline(m[1])}</li>);
                i++;
            }
            blocks.push(<ul key={key++}>{items}</ul>);
            continue;
        }

        if (ORDERED.test(line)) {
            flushParagraph();
            const items: ReactNode[] = [];
            while (i < lines.length && ORDERED.test(lines[i])) {
                const m = lines[i].match(ORDERED)!;
                items.push(<li key={items.length}>{renderInline(m[1])}</li>);
                i++;
            }
            blocks.push(<ol key={key++}>{items}</ol>);
            continue;
        }

        if (QUOTE.test(line)) {
            flushParagraph();
            const quoted: string[] = [];
            while (i < lines.length && QUOTE.test(lines[i])) {
                quoted.push(lines[i].match(QUOTE)![1]);
                i++;
            }
            blocks.push(
                <blockquote key={key++}>
                    {renderInline(quoted.join('\n'))}
                </blockquote>
            );
            continue;
        }

        if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
            flushParagraph();
            blocks.push(<hr key={key++} />);
            i++;
            continue;
        }

        if (!line.trim()) {
            flushParagraph();
        } else {
            paragraph.push(line);
        }
        i++;
    }
    flushParagraph();

    return <div className="ai-md">{blocks}</div>;
}
