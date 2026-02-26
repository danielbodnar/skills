// Putout Integration Examples

// 1. Webpack Integration
const webpackIntegration = {
  // webpack.config.js
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          },
          {
            loader: 'putout-loader',
            options: {
              fix: true,
              rules: {
                'remove-unused-variables': 'on',
                'remove-debugger': 'on'
              }
            }
          }
        ]
      }
    ]
  }
};

// 2. Rollup Integration
const rollupIntegration = {
  // rollup.config.js
  plugins: [
    {
      name: 'putout',
      transform(code, id) {
        if (id.endsWith('.js')) {
          const {transform} = require('putout');
          const result = transform(code, {
            fix: true,
            rules: {
              'remove-unused-variables': 'on',
              'convert-commonjs-to-esm': 'on'
            }
          });
          return result.code;
        }
        return null;
      }
    }
  ]
};

// 3. Vite Integration
const viteIntegration = {
  // vite.config.js
  plugins: [
    {
      name: 'putout',
      transform(code, id) {
        if (id.endsWith('.js') || id.endsWith('.ts')) {
          const {transform} = require('putout');
          return transform(code, {
            fix: true,
            plugins: ['remove-unused-variables', 'typescript/convert-generic-to-shorthand']
          });
        }
      }
    }
  ]
};

// 4. ESBuild Integration
const esbuildIntegration = {
  // esbuild.config.js
  plugins: [
    {
      name: 'putout',
      setup(build) {
        build.onLoad({filter: /\.js$/}, async (args) => {
          const fs = require('fs');
          const {transform} = require('putout');

          const source = fs.readFileSync(args.path, 'utf8');
          const result = transform(source, {
            fix: true,
            rules: {
              'remove-unused-variables': 'on',
              'remove-debugger': 'on'
            }
          });

          return {
            contents: result.code,
            loader: 'js'
          };
        });
      }
    }
  ]
};

// 5. Jest Integration
const jestIntegration = {
  // jest.config.js
  transform: {
    '^.+\\.js$': ['putout-jest-transformer', {
      fix: true,
      rules: {
        'remove-unused-variables': 'on',
        'remove-debugger': 'on'
      }
    }]
  },

  // Custom transformer
  putoutTransformer: {
    process(sourceText, sourcePath) {
      const {transform} = require('putout');
      const result = transform(sourceText, {
        fix: true,
        rules: {
          'remove-unused-variables': 'on',
          'remove-debugger': 'on'
        }
      });
      return result.code;
    }
  }
};

// 6. Babel Integration
const babelIntegration = {
  // babel.config.js
  plugins: [
    ['babel-plugin-putout', {
      fix: true,
      rules: {
        'remove-unused-variables': 'on',
        'convert-commonjs-to-esm': 'on'
      }
    }]
  ]
};

// 7. Prettier Integration
const prettierIntegration = {
  // .prettierrc.js
  plugins: [
    'prettier-plugin-putout'
  ],

  // Putout configuration
  putout: {
    rules: {
      'remove-unused-variables': 'on',
      'remove-debugger': 'on'
    }
  }
};

// 8. ESLint Integration
const eslintIntegration = {
  // .eslintrc.js
  plugins: ['putout'],

  rules: {
    'putout/putout': ['error', {
      rules: {
        'remove-unused-variables': 'on',
        'remove-debugger': 'on'
      }
    }]
  },

  // Custom ESLint rule
  customRule: {
    meta: {
      type: 'problem',
      docs: {
        description: 'Use putout transformations'
      },
      fixable: 'code'
    },

    create(context) {
      return {
        Program(node) {
          const {transform} = require('putout');
          const sourceCode = context.getSourceCode();
          const result = transform(sourceCode.getText(), {
            fix: true,
            rules: {
              'remove-unused-variables': 'on'
            }
          });

          if (result.code !== sourceCode.getText()) {
            context.report({
              node,
              message: 'Code can be optimized with putout',
              fix: (fixer) => fixer.replaceText(node, result.code)
            });
          }
        }
      };
    }
  }
};

// 9. TypeScript Integration
const typescriptIntegration = {
  // tsconfig.json
  compilerOptions: {
    plugins: [
      {
        name: 'typescript-putout-plugin',
        rules: {
          'typescript/convert-generic-to-shorthand': 'on',
          'typescript/remove-unused-types': 'on'
        }
      }
    ]
  }
};

// 10. GitHub Actions Integration
const githubActionsIntegration = {
  // .github/workflows/putout.yml
  workflow: `
name: Putout
on: [push, pull_request]

jobs:
  putout:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: putout . --fix
      - run: git diff --exit-code
  `
};

// 11. Husky Integration
const huskyIntegration = {
  // .husky/pre-commit
  script: `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

putout . --fix
git add .
`,

  // package.json
  scripts: {
    "prepare": "husky install",
    "pre-commit": "putout . --fix && git add ."
  }
};

// 12. Lint-staged Integration
const lintStagedIntegration = {
  // package.json
  "lint-staged": {
    "*.js": ["putout --fix", "git add"],
    "*.ts": ["putout --fix", "git add"]
  }
};

// 13. VS Code Integration
const vscodeIntegration = {
  // .vscode/settings.json
  settings: {
    "putout.enable": true,
    "putout.fix": true,
    "putout.rules": {
      "remove-unused-variables": "on",
      "remove-debugger": "on"
    },
    "editor.codeActionsOnSave": {
      "source.fixAll.putout": true
    }
  },

  // .vscode/extensions.json
  recommendations: [
    "putout.vscode-putout"
  ]
};

// 14. Vim Integration
const vimIntegration = {
  // .vimrc
  config: `
" Putout integration
autocmd FileType javascript,typescript :silent exec "!putout --fix %"
autocmd BufWritePre *.js,*.ts :silent exec "!putout --fix %"
  `
};

// 15. Docker Integration
const dockerIntegration = {
  // Dockerfile
  dockerfile: `
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN putout . --fix

CMD ["npm", "start"]
  `,

  // docker-compose.yml
  compose: `
version: '3.8'
services:
  app:
    build: .
    volumes:
      - .:/app
    command: sh -c "putout . --fix && npm start"
  `
};

// 16. Monorepo Integration
const monorepoIntegration = {
  // Root .putout.json
  rootConfig: {
    "rules": {
      "remove-unused-variables": "on",
      "remove-debugger": "on"
    },
    "match": {
      "packages/*/src/**/*.js": {
        "convert-commonjs-to-esm": "on"
      }
    }
  },

  // Package-specific .putout.json
  packageConfig: {
    "extends": ["../../.putout.json"],
    "rules": {
      "remove-console": "on"
    }
  }
};

// 17. Node.js Script Integration
const nodeScriptIntegration = {
  // build.js
  script: `
const {transform} = require('putout');
const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const result = transform(source, {
    fix: true,
    rules: {
      'remove-unused-variables': 'on',
      'remove-debugger': 'on'
    }
  });

  fs.writeFileSync(filePath, result.code);
  console.log('Processed:', filePath);
}

// Process all JavaScript files
const files = ['src/**/*.js', 'lib/**/*.js'];
files.forEach(pattern => {
  // Process files matching pattern
  processFile(pattern);
});
  `
};

// 18. CLI Tool Integration
const cliIntegration = {
  // package.json
  scripts: {
    "lint": "putout .",
    "lint:fix": "putout . --fix",
    "lint:staged": "lint-staged",
    "precommit": "putout . --fix && git add .",
    "prebuild": "putout . --fix",
    "postinstall": "putout . --fix"
  }
};

// 19. CI/CD Pipeline Integration
const cicdIntegration = {
  // .gitlab-ci.yml
  gitlab: `
stages:
  - lint
  - test
  - build

lint:
  stage: lint
  script:
    - npm ci
    - putout . --fix
    - git diff --exit-code
  `,

  // Azure DevOps
  azure: `
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '18.x'
  - script: npm ci
  - script: putout . --fix
  - script: git diff --exit-code
  `
};

// 20. API Integration
const apiIntegration = {
  // Express.js middleware
  expressMiddleware: (req, res, next) => {
    const {transform} = require('putout');

    if (req.body && req.body.code) {
      const result = transform(req.body.code, {
        fix: true,
        rules: {
          'remove-unused-variables': 'on',
          'remove-debugger': 'on'
        }
      });

      req.body.transformedCode = result.code;
    }

    next();
  },

  // REST API endpoint
  apiEndpoint: async (req, res) => {
    try {
      const {transform} = require('putout');
      const {code, rules} = req.body;

      const result = transform(code, {
        fix: true,
        rules: rules || {
          'remove-unused-variables': 'on',
          'remove-debugger': 'on'
        }
      });

      res.json({
        success: true,
        transformedCode: result.code,
        places: result.places
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

export {
  webpackIntegration,
  rollupIntegration,
  viteIntegration,
  esbuildIntegration,
  jestIntegration,
  babelIntegration,
  prettierIntegration,
  eslintIntegration,
  typescriptIntegration,
  githubActionsIntegration,
  huskyIntegration,
  lintStagedIntegration,
  vscodeIntegration,
  vimIntegration,
  dockerIntegration,
  monorepoIntegration,
  nodeScriptIntegration,
  cliIntegration,
  cicdIntegration,
  apiIntegration
};