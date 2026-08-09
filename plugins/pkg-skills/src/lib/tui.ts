/**
 * Space-to-toggle multi-select over packages.conf entries.
 * Pure ANSI — no TUI dependency, works in any terminal.
 * Keys: ↑/↓ or j/k move · space toggles · a all · n none · enter save · q/esc abort.
 */
import type { ConfEntry } from "#lib/schema.ts";

const CSI = "\x1b[";
const hideCursor = (): void => void process.stdout.write(`${CSI}?25l`);
const showCursor = (): void => void process.stdout.write(`${CSI}?25h`);
const clear = (lines: number): void => void process.stdout.write(`${CSI}${lines}A${CSI}J`);

// Render at most one screenful; the viewport follows the cursor.
const VIEWPORT = 20;

const renderList = (entries: ConfEntry[], cursor: number, offset: number): number => {
  const slice = entries.slice(offset, offset + VIEWPORT);
  const lines = slice.map((entry, i) => {
    const idx = offset + i;
    const mark = entry.enabled ? "[x]" : "[ ]";
    const pointer = idx === cursor ? ">" : " ";
    const version = entry.version === "" ? "" : ` @${entry.version}`;
    return `${pointer} ${mark} ${entry.manager}:${entry.name}${version}`;
  });
  const footer = `  ${entries.filter((e) => e.enabled).length}/${entries.length} selected — space toggle · a all · n none · enter save · q abort`;
  process.stdout.write(`${lines.join("\n")}\n${footer}\n`);
  return lines.length + 1;
};

/** Run the selector; resolves to updated entries, or null when aborted. */
export const selectEntries = async (entries: ConfEntry[]): Promise<ConfEntry[] | null> => {
  if (!process.stdin.isTTY) {
    console.error("pkg-skills select needs an interactive terminal (try: pkg-skills list / edit packages.conf directly)");
    return null;
  }
  const work = entries.map((e) => ({ ...e }));
  let cursor = 0;
  let offset = 0;
  let drawn = 0;

  process.stdin.setRawMode(true);
  process.stdin.resume();
  hideCursor();
  drawn = renderList(work, cursor, offset);

  const redraw = (): void => {
    if (cursor < offset) offset = cursor;
    if (cursor >= offset + VIEWPORT) offset = cursor - VIEWPORT + 1;
    clear(drawn);
    drawn = renderList(work, cursor, offset);
  };

  return new Promise((resolve) => {
    const done = (result: ConfEntry[] | null): void => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onKey);
      showCursor();
      resolve(result);
    };
    const onKey = (chunk: Buffer): void => {
      const key = chunk.toString();
      if (key === "q" || key === "\x1b" || key === "\x03") return done(null);
      if (key === "\r") return done(work);
      if (key === " ") {
        const entry = work[cursor];
        if (entry !== undefined) entry.enabled = !entry.enabled;
      } else if (key === "a") for (const entry of work) entry.enabled = true;
      else if (key === "n") for (const entry of work) entry.enabled = false;
      else if (key === "j" || key === `${CSI}B` || key === "\x1b[B") cursor = Math.min(cursor + 1, work.length - 1);
      else if (key === "k" || key === `${CSI}A` || key === "\x1b[A") cursor = Math.max(cursor - 1, 0);
      redraw();
    };
    process.stdin.on("data", onKey);
  });
};
