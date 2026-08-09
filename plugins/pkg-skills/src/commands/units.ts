/**
 * `pkg-skills units {install,enable,disable,status}` — systemd user units
 * and the alpm hook. User units are written directly; the alpm hook needs
 * root, so exact sudo commands are printed instead of run.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { systemdUserDir } from "#lib/paths.ts";

const UNIT_FILES = ["pkg-skills.service", "pkg-skills.timer", "pkg-skills-drain.path", "pkg-skills-drain.service"];

/** bin/ ships with the plugin, next to src/. */
const assetsDir = (): string => join(import.meta.dir, "..", "..", "bin");

const run = async (argv: string[]): Promise<number> => {
  const proc = Bun.spawn(argv, { stdout: "inherit", stderr: "inherit" });
  await proc.exited;
  return proc.exitCode ?? 1;
};

const install = (): void => {
  // The running executable is the ExecStart target (compiled binary or `bun src/index.ts`).
  const self = process.execPath.endsWith("/bun") ? `${process.execPath} run ${join(import.meta.dir, "..", "index.ts")}` : process.execPath;
  mkdirSync(systemdUserDir(), { recursive: true });
  for (const unit of UNIT_FILES) {
    const template = readFileSync(join(assetsDir(), "systemd", unit), "utf8");
    const target = join(systemdUserDir(), unit);
    writeFileSync(target, template.replaceAll("__PKG_SKILLS_BIN__", self));
    console.log(`installed ${target}`);
  }
  const hook = join(assetsDir(), "alpm", "pkg-skills.hook");
  console.log("");
  console.log("alpm hook needs root — run:");
  console.log(`  sudo install -Dm644 ${hook} /etc/pacman.d/hooks/pkg-skills.hook`);
  console.log("  sudo mkdir -p /var/lib/pkg-skills");
  console.log("  sudo touch /var/lib/pkg-skills/spool");
  console.log("  sudo chmod 0666 /var/lib/pkg-skills/spool");
  console.log("");
  console.log("then enable the automation:");
  console.log("  systemctl --user daemon-reload");
  console.log("  systemctl --user enable --now pkg-skills.timer pkg-skills-drain.path");
};

export const units = async (action: string | undefined): Promise<void> => {
  switch (action) {
    case "install":
      install();
      return;
    case "enable":
      await run(["systemctl", "--user", "daemon-reload"]);
      process.exitCode = await run(["systemctl", "--user", "enable", "--now", "pkg-skills.timer", "pkg-skills-drain.path"]);
      return;
    case "disable":
      process.exitCode = await run(["systemctl", "--user", "disable", "--now", "pkg-skills.timer", "pkg-skills-drain.path"]);
      return;
    case "status": {
      for (const unit of UNIT_FILES) {
        const installed = existsSync(join(systemdUserDir(), unit));
        console.log(`${installed ? "[x]" : "[ ]"} ${join(systemdUserDir(), unit)}`);
      }
      await run(["systemctl", "--user", "--no-pager", "status", "pkg-skills.timer", "pkg-skills-drain.path"]);
      return;
    }
    default:
      console.error("usage: pkg-skills units {install|enable|disable|status}");
      process.exitCode = 1;
  }
};
