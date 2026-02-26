// Basic Putout Usage Examples

// 1. Installation and Setup
// bun add -d putout
// npm install -D putout

// 2. Basic CLI Usage
// putout lib                  # Find issues
// putout lib --fix           # Fix issues
// putout src test --fix      # Fix multiple directories

// 3. Configuration File (.putout.json)
const putoutConfig = {
  "rules": {
    "remove-unused-variables": "on",
    "remove-debugger": "on",
    "remove-console": "off",
    "convert-commonjs-to-esm": "on",
    "simplify-logical-expressions": "on"
  },
  "plugins": [
    "remove-empty",
    "remove-useless-variables"
  ],
  "match": {
    "*.test.js": {
      "remove-only": "on"
    },
    "src/**/*.js": {
      "nodejs/convert-commonjs-to-esm": "on"
    }
  },
  "ignore": [
    "node_modules",
    "dist",
    "build",
    ".putout.json"
  ]
};

// 4. Programmatic Usage
import {transform} from 'putout';

const source = `
const unused = 5;
debugger;
console.log('hello');
if (true) {
  console.log('world');
}
`;

const result = transform(source, {
  plugins: ['remove-unused-variables', 'remove-debugger']
});

console.log(result.code);
// Output: console.log('hello'); if (true) { console.log('world'); }

// 5. Custom Rule Application
const customTransform = transform(source, {
  rules: {
    'remove-unused-variables': 'on',
    'remove-debugger': 'on',
    'remove-console': 'off'
  }
});

// 6. File-specific Transformations
const fileTransform = transform(source, {
  match: {
    '*.test.js': {
      'remove-only': 'on'
    }
  }
});

// 7. Environment-specific Configuration
const envConfig = {
  env: {
    development: {
      rules: {
        'remove-console': 'off',
        'remove-debugger': 'off'
      }
    },
    production: {
      rules: {
        'remove-console': 'on',
        'remove-debugger': 'on'
      }
    }
  }
};

// 8. Common Transformations
const commonTransforms = [
  'remove-unused-variables',
  'remove-debugger',
  'remove-empty',
  'simplify-logical-expressions',
  'convert-commonjs-to-esm',
  'remove-useless-variables'
];

// 9. CLI Options Examples
/*
putout src --fix                    # Fix all issues
putout src --disable-all           # Disable all rules
putout src --enable remove-debugger # Enable specific rule
putout src --transform remove-unused-variables # Apply single transform
putout src --format json           # JSON output format
putout src --progress              # Show progress
putout src --cache                 # Enable caching
*/

// 10. Package.json Scripts
const packageScripts = {
  "scripts": {
    "lint": "putout .",
    "lint:fix": "putout . --fix",
    "lint:check": "putout . --no-exit-code",
    "lint:cache": "putout . --cache",
    "lint:progress": "putout . --progress"
  }
};

export {
  putoutConfig,
  transform,
  commonTransforms,
  envConfig,
  packageScripts
};