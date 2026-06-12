/**
 * Shared helpers for manager enumerators: command detection and capture.
 * Enumerators must never throw on a missing/broken manager — they return [].
 */

export const commandExists = (cmd: string): boolean => Bun.which(cmd) !== null;

/** Run a command, returning stdout ("" on any failure — enumerators degrade gracefully). */
export const capture = async (argv: string[]): Promise<string> => {
  try {
    const proc = Bun.spawn(argv, { stdout: "pipe", stderr: "ignore" });
    const text = await new Response(proc.stdout).text();
    await proc.exited;
    return proc.exitCode === 0 ? text : "";
  } catch {
    return "";
  }
};
