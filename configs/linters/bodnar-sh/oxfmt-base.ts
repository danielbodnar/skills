import { base, type OxfmtConfig } from "./presets";

export function extendOxfmt(overrides: Partial<OxfmtConfig> = {}): OxfmtConfig {
  return { ...base, ...overrides };
}

export default extendOxfmt();
