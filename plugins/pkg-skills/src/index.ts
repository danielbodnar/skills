#!/usr/bin/env bun
/**
 * pkg-skills — index installed packages and generate per-package Claude skills.
 */
import { sync } from "#commands/sync.ts";
import { select } from "#commands/select.ts";
import { generate } from "#commands/generate.ts";
import { fetchCmd, list, meta, status, validateCmd } from "#commands/info.ts";
import { units } from "#commands/units.ts";

const HELP = `pkg-skills — generate Claude skills from installed packages

usage: pkg-skills <command> [args]

  sync                       refresh packages.conf from every package manager
  select                     space-to-toggle opt-in TUI over packages.conf
  list                       show packages and opt-in state
  generate [pkg…]            generate skills for opted-in packages
           --changed-only    only packages whose version changed
           --drain           consume the alpm spool (used by systemd)
  fetch <pkg>                refresh the local doc cache for one package
  meta <pkg>                 print template variables as JSON (for /pkg-skills-scaffold)
  validate <skill-dir>       lint a generated skill against best practices
  units <action>             install|enable|disable|status for systemd automation
  status                     paths, managers, and opt-in summary

config: $XDG_CONFIG_HOME/pkg-skills/{config.toml,packages.conf}`;

const main = async (): Promise<void> => {
  const [command, ...args] = process.argv.slice(2);
  switch (command) {
    case "sync":
      return sync();
    case "select":
      return select();
    case "list":
      return list();
    case "generate":
      return generate(args);
    case "fetch":
      return fetchCmd(args[0]);
    case "meta":
      return meta(args[0]);
    case "validate":
      return validateCmd(args[0]);
    case "units":
      return units(args[0]);
    case "status":
      return status();
    case undefined:
    case "help":
    case "--help":
    case "-h":
      console.log(HELP);
      return;
    default:
      console.error(`unknown command: ${command}\n`);
      console.log(HELP);
      process.exitCode = 1;
  }
};

await main();
