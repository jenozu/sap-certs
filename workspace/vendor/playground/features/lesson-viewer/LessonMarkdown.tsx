import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";
// ponytail: @lezer/highlight is a transitive dep of @codemirror/language (always installed with it);
// declare it in package.json if the package manager ever stops hoisting.
import { highlightCode, tagHighlighter, tags as t } from "@lezer/highlight";
import type { Parser } from "@lezer/common";
import { SQLite } from "@codemirror/lang-sql";
import { pythonLanguage } from "@codemirror/lang-python";
import {
  javascriptLanguage,
  typescriptLanguage,
} from "@codemirror/lang-javascript";

type Node = {
  type: string;
  value?: string;
  children?: Node[];
  data?: Record<string, unknown>;
};

const CALLOUT = /^\[!(NOTE|TIP|WARNING)\]\s*/i;

// Marks `> [!NOTE]` blockquotes with data-callout and strips the marker.
function remarkCallouts() {
  const walk = (n: Node) => {
    if (n.type === "blockquote") {
      let first: Node | undefined = n.children?.[0];
      while (first && first.type !== "text") first = first.children?.[0];
      const m = first?.value && CALLOUT.exec(first.value);
      if (first && m) {
        first.value = first.value!.slice(m[0].length);
        n.data = { hProperties: { "data-callout": m[1].toLowerCase() } };
      }
    }
    n.children?.forEach(walk);
  };
  return walk;
}

// Allow only http(s), mailto and relative URLs.
export function safeUrl(url: string): string {
  const u = url.trim();
  if (/^(https?:|mailto:)/i.test(u)) return u;
  // anything else with a scheme (javascript:, data:, vbscript:...) is dropped;
  // control chars/whitespace are stripped first so "java\tscript:" can't sneak by.
  // eslint-disable-next-line no-control-regex
  if (/^[a-z][a-z0-9+.-]*:/i.test(u.replace(/[\u0000- ]/g, ""))) return "";
  // protocol-relative: browsers treat "\" like "/", so "/\host" is "//host"
  if (/^[/\\]{2}/.test(u)) return "";
  return u;
}

// Map, not an object: fence languages are untrusted ("constructor", "__proto__").
const PARSERS = new Map<string, Parser>([
  ["sql", SQLite.language.parser],
  ["python", pythonLanguage.parser],
  ["py", pythonLanguage.parser],
  ["javascript", javascriptLanguage.parser],
  ["js", javascriptLanguage.parser],
  ["typescript", typescriptLanguage.parser],
  ["ts", typescriptLanguage.parser],
]);

const highlighter = tagHighlighter([
  { tag: [t.keyword, t.operatorKeyword, t.modifier], class: "text-purple-400" },
  { tag: t.string, class: "text-green-400" },
  { tag: [t.number, t.bool, t.null], class: "text-orange-400" },
  { tag: t.comment, class: "text-neutral-500 italic" },
  {
    tag: [t.function(t.variableName), t.function(t.propertyName)],
    class: "text-blue-400",
  },
  { tag: [t.typeName, t.className], class: "text-yellow-300" },
]);

// Static highlighting as React text/spans (never innerHTML). null = unknown language.
export function highlight(code: string, lang: string): ReactNode[] | null {
  const parser = PARSERS.get(lang.toLowerCase());
  if (!parser) return null;
  const out: ReactNode[] = [];
  highlightCode(
    code,
    parser.parse(code),
    highlighter,
    (text, cls) =>
      out.push(
        cls ? (
          <span key={out.length} className={cls}>
            {text}
          </span>
        ) : (
          text
        ),
      ),
    () => out.push("\n"),
  );
  return out;
}

const CALLOUT_STYLE: Record<string, string> = {
  note: "border-blue-500 bg-blue-500/10",
  tip: "border-green-500 bg-green-500/10",
  warning: "border-yellow-500 bg-yellow-500/10",
};

export interface LessonMarkdownProps {
  markdown: string;
  title?: string;
  estimatedMinutes?: number;
  /** Maps a relative course path to a URL (e.g. a blob URL). */
  resolveAsset?: (path: string) => string | undefined;
}

export function LessonMarkdown({
  markdown,
  title,
  estimatedMinutes,
  resolveAsset,
}: LessonMarkdownProps) {
  const components: Components = {
    a: ({ href, children }) =>
      !href ? (
        <span>{children}</span>
      ) : (
        <a
          href={href}
          {...(/^https?:/i.test(href)
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className="text-blue-400 underline"
        >
          {children}
        </a>
      ),
    img: ({ src, alt }) => {
      if (!src || typeof src !== "string") return null; // React 19 types allow Blob
      const isRelative = !/^(https?:|mailto:)/i.test(src);
      const resolved = isRelative && resolveAsset ? resolveAsset(src) : src;
      return resolved ? (
        <img src={resolved} alt={alt ?? ""} className="max-w-full" />
      ) : null;
    },
    code: ({ className, children }) => {
      const lang = /language-([\w-]+)/.exec(className ?? "")?.[1];
      const nodes =
        lang && typeof children === "string"
          ? highlight(children.replace(/\n$/, ""), lang)
          : null;
      return <code className={className}>{nodes ?? children}</code>;
    },
    pre: ({ children }) => (
      <pre className="overflow-x-auto rounded bg-neutral-900 p-3 text-sm">
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <table className="my-3 border-collapse border border-neutral-600">
        {children}
      </table>
    ),
    th: ({ children }) => (
      <th className="border border-neutral-600 px-2 py-1">{children}</th>
    ),
    td: ({ children }) => (
      <td className="border border-neutral-600 px-2 py-1">{children}</td>
    ),
    blockquote: (props) => {
      const kind = (props as Record<string, unknown>)["data-callout"] as
        string | undefined;
      return (
        <blockquote
          data-callout={kind}
          className={`my-3 border-l-4 px-3 py-1 ${kind ? CALLOUT_STYLE[kind] : "border-neutral-500"}`}
        >
          {props.children}
        </blockquote>
      );
    },
  };

  return (
    <article className="lesson-markdown">
      {title && <h1 className="text-2xl font-semibold">{title}</h1>}
      {estimatedMinutes !== undefined && (
        <p className="mb-3 text-sm text-neutral-400">{estimatedMinutes} min</p>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkCallouts]}
        urlTransform={safeUrl}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
