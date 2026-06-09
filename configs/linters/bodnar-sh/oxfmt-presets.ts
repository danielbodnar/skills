export const base = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  quoteProps: "as-needed" as const,
  trailingComma: "all" as const,
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: "always" as const,
  endOfLine: "lf" as const,
};

export type OxfmtConfig = typeof base;
