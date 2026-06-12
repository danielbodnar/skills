/**
 * XDG base-directory resolution. Every path pkg-skills touches comes from here
 * so the whole tool is relocatable via standard environment variables.
 */
import { homedir } from "node:os";
import { join } from "node:path";

const home = (): string => process.env.HOME ?? homedir();

const xdg = (envVar: string, fallback: string): string => {
  const value = process.env[envVar];
  return value !== undefined && value !== "" ? value : join(home(), fallback);
};

export const xdgConfigHome = (): string => xdg("XDG_CONFIG_HOME", ".config");
export const xdgDataHome = (): string => xdg("XDG_DATA_HOME", ".local/share");
export const xdgStateHome = (): string => xdg("XDG_STATE_HOME", ".local/state");
export const xdgCacheHome = (): string => xdg("XDG_CACHE_HOME", ".cache");

/** $XDG_CONFIG_HOME/pkg-skills — config.toml, pkg-skills.conf, packages.conf. */
export const configDir = (): string => join(xdgConfigHome(), "pkg-skills");
export const configFile = (): string => join(configDir(), "config.toml");
export const envFile = (): string => join(configDir(), "pkg-skills.conf");
export const packagesConf = (): string => join(configDir(), "packages.conf");

/** $XDG_CACHE_HOME/pkg-skills/<manager>__<name> — fetched docs per package. */
export const cacheDir = (): string => join(xdgCacheHome(), "pkg-skills");
export const packageCacheDir = (manager: string, name: string): string =>
  join(cacheDir(), `${manager}__${name.replaceAll("/", "_")}`);

/** $XDG_STATE_HOME/pkg-skills — generation state (hashes, timestamps). */
export const stateDir = (): string => join(xdgStateHome(), "pkg-skills");
export const stateFile = (): string => join(stateDir(), "state.json");

/** Default staging area for generated skill directories before `skills add`. */
export const defaultOutputDir = (): string => join(xdgDataHome(), "pkg-skills", "generated");

/** systemd user unit directory. */
export const systemdUserDir = (): string => join(xdgConfigHome(), "systemd", "user");

/** Spool file the alpm hook appends to and the user drain service consumes. */
export const ALPM_SPOOL = "/var/lib/pkg-skills/spool";
