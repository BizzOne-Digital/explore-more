"use client";

import type { ReactNode } from "react";

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function isTableRow(line: string) {
  return line.trim().startsWith("|") && line.trim().endsWith("|");
}

export function AssistantAnswerMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;
    const [header, ...body] = tableRows;
    tableRows = [];
    blocks.push(
      <div key={`table-${blocks.length}`} className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[280px] text-left text-sm">
          <thead className="bg-white/10 text-white/90">
            <tr>
              {header.map((cell, ci) => (
                <th key={ci} className="px-3 py-2 font-semibold">
                  {cell.trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-white/85">
            {body
              .filter((row) => !row.every((c) => /^-+$/.test(c.trim())))
              .map((row, ri) => (
                <tr key={ri} className="bg-black/20">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 align-top">
                      {renderInline(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushTable();
      i += 1;
      continue;
    }

    if (isTableRow(trimmed)) {
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      tableRows.push(cells);
      i += 1;
      continue;
    }

    flushTable();

    if (trimmed.startsWith("## ")) {
      blocks.push(
        <h2
          key={`h2-${i}`}
          className="font-display text-xl font-bold text-explore-lime sm:text-2xl"
        >
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      blocks.push(
        <h3 key={`h3-${i}`} className="mt-4 text-base font-semibold text-white">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*] /, ""));
        i += 1;
      }
      blocks.push(
        <ul key={`ul-${i}`} className="list-disc space-y-1.5 pl-5 text-white/90">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    blocks.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed text-white/90 sm:text-[15px]">
        {renderInline(trimmed)}
      </p>
    );
    i += 1;
  }

  flushTable();

  return <div className="space-y-3">{blocks}</div>;
}
