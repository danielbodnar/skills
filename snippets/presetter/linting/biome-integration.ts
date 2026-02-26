// Presetter with Biome Integration
import { preset } from 'presetter';
import esm from 'presetter-preset-esm';

// 1. Biome configuration with Presetter
export default preset('biome-app', {
  extends: [esm],
  dependencies: {
    devDependencies: {
      '@biomejs/biome': '^1.9.0'
    }
  },

  override: {
    'biome.json': {
      $schema: './node_modules/@biomejs/biome/configuration_schema.json',
      vcs: {
        enabled: true,
        clientKind: 'git',
        useIgnoreFile: true
      },
      files: {
        ignoreUnknown: false,
        ignore: [
          'dist/',
          'build/',
          'node_modules/',
          '*.d.ts',
          'coverage/',
          '.next/',
          '.nuxt/',
          '.output/',
          '.vercel/',
          '.netlify/'
        ]
      },
      formatter: {
        enabled: true,
        formatWithErrors: false,
        indentStyle: 'space',
        indentWidth: 2,
        lineEnding: 'lf',
        lineWidth: 100,
        attributePosition: 'auto'
      },
      organizeImports: {
        enabled: true
      },
      linter: {
        enabled: true,
        rules: {
          recommended: true,
          complexity: {
            noExcessiveCognitiveComplexity: 'error',
            noVoid: 'off'
          },
          correctness: {
            noUnusedVariables: 'error',
            useExhaustiveDependencies: 'warn'
          },
          performance: {
            noAccumulatingSpread: 'warn',
            noDelete: 'error'
          },
          security: {
            noDangerouslySetInnerHtml: 'error',
            noGlobalEval: 'error'
          },
          style: {
            noNonNullAssertion: 'off',
            useConsistentArrayType: 'error',
            useForOf: 'error',
            useShorthandPropertyAssignment: 'error'
          },
          suspicious: {
            noArrayIndexKey: 'warn',
            noEmptyBlockStatements: 'error',
            noExplicitAny: 'warn'
          }
        }
      },
      javascript: {
        formatter: {
          jsxQuoteStyle: 'double',
          quoteProperties: 'asNeeded',
          trailingCommas: 'es5',
          semicolons: 'always',
          arrowParentheses: 'always',
          bracketSpacing: true,
          bracketSameLine: false,
          quoteStyle: 'single',
          attributePosition: 'auto'
        },
        globals: ['console', 'process', 'Buffer']
      },
      json: {
        formatter: {
          enabled: true,
          indentStyle: 'space',
          indentWidth: 2,
          lineEnding: 'lf',
          lineWidth: 100,
          trailingCommas: 'none'
        }
      },
      css: {
        formatter: {
          enabled: true,
          indentStyle: 'space',
          indentWidth: 2,
          lineEnding: 'lf',
          lineWidth: 100,
          quoteStyle: 'double'
        },
        linter: {
          enabled: true,
          rules: {
            recommended: true
          }
        }
      }
    },

    'package.json': {
      scripts: {
        'lint': 'biome check .',
        'lint:fix': 'biome check --write .',
        'format': 'biome format .',
        'format:fix': 'biome format --write .',
        'check': 'biome check .',
        'check:fix': 'biome check --write .'
      }
    }
  },

  templates: {
    '.vscode/settings.json': `{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}`,

    '.vscode/extensions.json': `{
  "recommendations": [
    "biomejs.biome"
  ]
}`
  }
});

// 2. React-specific Biome configuration
export const reactBiomePreset = preset('react-biome', {
  extends: [esm],
  dependencies: {
    devDependencies: {
      '@biomejs/biome': '^1.9.0'
    }
  },

  override: {
    'biome.json': {
      $schema: './node_modules/@biomejs/biome/configuration_schema.json',
      files: {
        ignore: ['dist/', 'build/', 'node_modules/', '*.d.ts']
      },
      formatter: {
        enabled: true,
        indentStyle: 'space',
        indentWidth: 2,
        lineWidth: 100
      },
      linter: {
        enabled: true,
        rules: {
          recommended: true,
          // React-specific rules
          a11y: {
            recommended: true,
            useAltText: 'error',
            useAriaProps: 'error',
            useKeyWithClickEvents: 'error'
          },
          correctness: {
            useExhaustiveDependencies: 'warn',
            useHookAtTopLevel: 'error'
          },
          suspicious: {
            noArrayIndexKey: 'warn',
            noComponentImplicitlyReturnFunction: 'error'
          }
        }
      },
      javascript: {
        formatter: {
          jsxQuoteStyle: 'double',
          arrowParentheses: 'always'
        }
      }
    }
  }
});

// 3. Strict Biome configuration for libraries
export const strictBiomePreset = preset('strict-biome', {
  extends: [esm],
  dependencies: {
    devDependencies: {
      '@biomejs/biome': '^1.9.0'
    }
  },

  override: {
    'biome.json': {
      $schema: './node_modules/@biomejs/biome/configuration_schema.json',
      linter: {
        enabled: true,
        rules: {
          recommended: true,
          complexity: {
            noExcessiveCognitiveComplexity: 'error',
            noForEach: 'error',
            noMultipleSpacesInRegularExpressionLiterals: 'error',
            noUselessCatch: 'error',
            noUselessConstructor: 'error',
            noUselessEmptyExport: 'error',
            noUselessFragments: 'error',
            noUselessLabel: 'error',
            noUselessLoneBlockStatements: 'error',
            noUselessRename: 'error',
            noUselessSwitchCase: 'error',
            noUselessTernary: 'error',
            noUselessThisAlias: 'error',
            noUselessTypeConstraint: 'error',
            noVoid: 'error',
            noWith: 'error',
            useLiteralKeys: 'error',
            useOptionalChain: 'error',
            useRegexLiterals: 'error',
            useSimpleNumberKeys: 'error',
            useSimplifiedLogicExpression: 'error'
          },
          correctness: {
            noConstAssign: 'error',
            noConstantCondition: 'error',
            noEmptyCharacterClassInRegex: 'error',
            noEmptyPattern: 'error',
            noGlobalObjectCalls: 'error',
            noInnerDeclarations: 'error',
            noInvalidConstructorSuper: 'error',
            noNewSymbol: 'error',
            noNonoctalDecimalEscape: 'error',
            noPrecisionLoss: 'error',
            noSelfAssign: 'error',
            noSetterReturn: 'error',
            noSwitchDeclarations: 'error',
            noUndeclaredVariables: 'error',
            noUnreachable: 'error',
            noUnreachableSuper: 'error',
            noUnsafeFinally: 'error',
            noUnsafeOptionalChaining: 'error',
            noUnusedLabels: 'error',
            noUnusedVariables: 'error',
            useIsNan: 'error',
            useValidForDirection: 'error',
            useYield: 'error'
          },
          style: {
            noArguments: 'error',
            noCommaOperator: 'error',
            noImplicitBoolean: 'error',
            noNegationElse: 'error',
            noNonNullAssertion: 'error',
            noParameterAssign: 'error',
            noParameterProperties: 'error',
            noRestrictedGlobals: 'error',
            noUnusedTemplateLiteral: 'error',
            noVar: 'error',
            useAsConstAssertion: 'error',
            useBlockStatements: 'error',
            useCollapsedElseIf: 'error',
            useConsistentArrayType: 'error',
            useConst: 'error',
            useDefaultParameterLast: 'error',
            useEnumInitializers: 'error',
            useExponentiationOperator: 'error',
            useFragmentSyntax: 'error',
            useLiteralEnumMembers: 'error',
            useNamingConvention: 'error',
            useNodejsImportProtocol: 'error',
            useNumberNamespace: 'error',
            useNumericLiterals: 'error',
            useSelfClosingElements: 'error',
            useShorthandArrayType: 'error',
            useShorthandAssign: 'error',
            useSingleVarDeclarator: 'error',
            useTemplate: 'error'
          }
        }
      }
    }
  }
});

// 4. Biome with pre-commit integration
export const biomePreCommitPreset = preset('biome-precommit', {
  extends: [esm],
  dependencies: {
    devDependencies: {
      '@biomejs/biome': '^1.9.0',
      'husky': '^9.0.0',
      'lint-staged': '^15.0.0'
    }
  },

  override: {
    'package.json': {
      scripts: {
        'prepare': 'husky install'
      },
      'lint-staged': {
        '*.{js,jsx,ts,tsx,json,css,md}': ['biome check --write']
      }
    }
  },

  templates: {
    '.husky/pre-commit': `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged`,

    '.husky/commit-msg': `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit "$1"`
  }
});