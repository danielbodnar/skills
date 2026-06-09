const config = {
  plugins: ["typescript", "unicorn", "import", "promise", "node", "jsdoc"],
  categories: {
    correctness: "error",
    suspicious: "error",
    perf: "warn",
    style: "off",
  },
  rules: {
    "no-console": "warn",
    "no-debugger": "error",
    "no-var": "error",
    "prefer-const": "error",
    eqeqeq: ["error", "always"],
    "typescript/no-explicit-any": "warn",
    "typescript/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "unicorn/no-null": "off",
    "import/no-default-export": "off",
  },
  env: {
    browser: true,
    node: true,
    es2024: true,
  },
  globals: {
    Bun: "readonly",
  },
};

export default config;
