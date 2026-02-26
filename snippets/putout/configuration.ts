// Putout Configuration Examples

// 1. Basic Configuration (.putout.json)
const basicConfig = {
  "rules": {
    "remove-unused-variables": "on",
    "remove-debugger": "on",
    "remove-console": "off"
  }
};

// 2. Advanced Configuration with Plugins
const advancedConfig = {
  "rules": {
    "remove-unused-variables": "on",
    "remove-debugger": "on",
    "remove-console": "off",
    "convert-commonjs-to-esm": "on",
    "nodejs/convert-commonjs-to-esm": "on"
  },
  "plugins": [
    "remove-empty",
    "remove-useless-variables",
    "simplify-logical-expressions",
    "@putout/plugin-remove-unused-variables"
  ],
  "match": {
    "*.test.js": {
      "remove-only": "on",
      "remove-skip": "on"
    },
    "src/**/*.js": {
      "nodejs/convert-commonjs-to-esm": "on"
    },
    "lib/**/*.ts": {
      "typescript/convert-generic-to-shorthand": "on"
    }
  },
  "ignore": [
    "node_modules",
    "dist",
    "build",
    ".putout.json",
    "coverage"
  ],
  "processors": [
    "markdown",
    "yaml",
    "json"
  ]
};

// 3. Environment-specific Configuration
const environmentConfig = {
  "env": {
    "development": {
      "rules": {
        "remove-console": "off",
        "remove-debugger": "off"
      }
    },
    "production": {
      "rules": {
        "remove-console": "on",
        "remove-debugger": "on",
        "remove-unused-variables": "on"
      }
    },
    "test": {
      "rules": {
        "remove-only": "on",
        "remove-skip": "on"
      }
    }
  }
};

// 4. Framework-specific Configuration
const frameworkConfigs = {
  // React configuration
  react: {
    "rules": {
      "react/convert-class-to-function": "on",
      "react/remove-unused-state": "on",
      "react/convert-state-to-hooks": "on"
    },
    "plugins": [
      "@putout/plugin-react"
    ]
  },
  
  // Node.js configuration
  nodejs: {
    "rules": {
      "nodejs/convert-commonjs-to-esm": "on",
      "nodejs/convert-top-level-return": "on",
      "nodejs/remove-process-exit": "on"
    },
    "plugins": [
      "@putout/plugin-nodejs"
    ]
  },
  
  // TypeScript configuration
  typescript: {
    "rules": {
      "typescript/convert-generic-to-shorthand": "on",
      "typescript/remove-unused-types": "on",
      "typescript/convert-interface-to-type": "on"
    },
    "plugins": [
      "@putout/plugin-typescript"
    ]
  }
};

// 5. Custom Rule Configuration
const customRuleConfig = {
  "rules": {
    "my-custom-rule": ["error", {
      "aggressive": true,
      "skipPatterns": ["test", "spec"]
    }]
  },
  "rulesdir": "./custom-rules"
};

// 6. File Pattern Matching
const filePatternConfig = {
  "match": {
    "*.test.{js,ts}": {
      "remove-only": "on",
      "remove-skip": "on"
    },
    "src/**/*.{js,ts}": {
      "remove-unused-variables": "on",
      "convert-commonjs-to-esm": "on"
    },
    "lib/**/*.js": {
      "nodejs/convert-commonjs-to-esm": "on"
    },
    "**/*.spec.js": {
      "remove-only": "on"
    }
  }
};

// 7. Processor Configuration
const processorConfig = {
  "processors": [
    "markdown",
    "yaml", 
    "json"
  ],
  "rules": {
    "markdown/remark": "on",
    "yaml/sort-keys": "on",
    "json/sort-keys": "on"
  }
};

// 8. Plugin Options Configuration
const pluginOptionsConfig = {
  "plugins": [
    ["remove-unused-variables", {
      "aggressive": true
    }],
    ["convert-commonjs-to-esm", {
      "type": "module"
    }],
    ["@putout/plugin-react", {
      "convertClassToFunction": true
    }]
  ]
};

// 9. Formatter Configuration
const formatterConfig = {
  "formatter": {
    "name": "json",
    "options": {
      "pretty": true
    }
  }
};

// 10. Complete Configuration Example
const completeConfig = {
  "rules": {
    "remove-unused-variables": "on",
    "remove-debugger": "on",
    "remove-console": "off",
    "convert-commonjs-to-esm": "on",
    "simplify-logical-expressions": "on",
    "remove-empty": "on",
    "nodejs/convert-commonjs-to-esm": "on",
    "typescript/convert-generic-to-shorthand": "on"
  },
  "plugins": [
    "remove-empty",
    "remove-useless-variables",
    "simplify-logical-expressions",
    "@putout/plugin-nodejs",
    "@putout/plugin-typescript",
    "@putout/plugin-react"
  ],
  "match": {
    "*.test.{js,ts}": {
      "remove-only": "on",
      "remove-skip": "on"
    },
    "src/**/*.{js,ts}": {
      "remove-unused-variables": "on",
      "convert-commonjs-to-esm": "on"
    },
    "lib/**/*.ts": {
      "typescript/convert-generic-to-shorthand": "on"
    }
  },
  "ignore": [
    "node_modules",
    "dist",
    "build",
    ".putout.json",
    "coverage",
    "*.min.js"
  ],
  "processors": [
    "markdown",
    "yaml",
    "json"
  ],
  "formatter": {
    "name": "json",
    "options": {
      "pretty": true
    }
  },
  "env": {
    "development": {
      "rules": {
        "remove-console": "off",
        "remove-debugger": "off"
      }
    },
    "production": {
      "rules": {
        "remove-console": "on",
        "remove-debugger": "on"
      }
    }
  }
};

// 11. Configuration Inheritance
const baseConfig = {
  "extends": ["@putout/config-recommended"],
  "rules": {
    "remove-console": "off"
  }
};

// 12. Dynamic Configuration
const dynamicConfig = {
  "rules": {
    "remove-console": process.env.NODE_ENV === "production" ? "on" : "off"
  }
};

export {
  basicConfig,
  advancedConfig,
  environmentConfig,
  frameworkConfigs,
  customRuleConfig,
  filePatternConfig,
  processorConfig,
  pluginOptionsConfig,
  formatterConfig,
  completeConfig,
  baseConfig,
  dynamicConfig
};