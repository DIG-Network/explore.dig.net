// markdown.tsx — the store's tiny, SAFE markdown renderer for author-provided app descriptions.
//
// SPEC.md §3 fixes the description format to a small GitHub-flavored subset: paragraphs, ##/###
// headings, - bullet lists, **bold**, *italic*, `code`, and [links](https://…). This renderer
// builds REAL React elements from that subset — it never touches innerHTML, so author content can
// not inject markup, and only http(s) link targets are honored (anything else renders as text).

import type { ReactNode } from "react";
import { Fragment } from "react";

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] };

/** Group markdown source lines into block-level structures (pure). */
export function parseBlocks(source: string): Block[] {
  const lines = source.split(/\r?\n/);
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "p", text: paragraph.join(" ") });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({ type: "ul", items: list });
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trim() === "") {
      flushParagraph();
      flushList();
    } else if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h3", text: line.slice(4).trim() });
    } else if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h2", text: line.slice(3).trim() });
    } else if (/^[-*] /.test(line.trim())) {
      flushParagraph();
      (list ??= []).push(line.trim().slice(2).trim());
    } else {
      flushList();
      paragraph.push(line.trim());
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

// One pass over the inline syntax: code spans, links, bold, italic. Ordered so `code` wins inside
// ambiguity and ** is consumed before *.
const INLINE = /`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;

/** Render inline markdown to React nodes (pure; safe — links restricted to http/https). */
export function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(INLINE)) {
    const index = m.index ?? 0;
    if (index > last) out.push(text.slice(last, index));
    if (m[1] !== undefined) {
      out.push(<code key={key++}>{m[1]}</code>);
    } else if (m[2] !== undefined && m[3] !== undefined) {
      out.push(
        <a key={key++} href={m[3]} target="_blank" rel="noopener noreferrer">
          {m[2]}
        </a>,
      );
    } else if (m[4] !== undefined) {
      out.push(<strong key={key++}>{m[4]}</strong>);
    } else if (m[5] !== undefined) {
      out.push(<em key={key++}>{m[5]}</em>);
    }
    last = index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export interface MarkdownProps {
  /** The markdown source (the SPEC.md §3 subset). */
  source: string;
}

/** Render an app description. Headings render as h3/h4 (the page's h1/h2 belong to the store). */
export function Markdown({ source }: MarkdownProps) {
  const blocks = parseBlocks(source);
  return (
    <div className="markdown">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return <h3 key={i}>{renderInline(block.text)}</h3>;
          case "h3":
            return <h4 key={i}>{renderInline(block.text)}</h4>;
          case "ul":
            return (
              <ul key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ul>
            );
          case "p":
            return <p key={i}>{renderInline(block.text)}</p>;
          default:
            return <Fragment key={i} />;
        }
      })}
    </div>
  );
}
