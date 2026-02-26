// Basic Presetter Setup
// Basic configuration for TypeScript projects

// 1. Simple ESM preset adoption
export { default } from 'presetter-preset-esm';

// 2. Basic setup with minimal configuration
import { preset } from 'presetter';
import esm from 'presetter-preset-esm';

export default preset('my-project', {
  extends: [esm]
});

// 3. CommonJS setup
import { preset } from 'presetter';
import cjs from 'presetter-preset-cjs';

export default preset('my-legacy-project', {
  extends: [cjs],
  variables: {
    target: 'ES2020'
  }
});

// 4. Hybrid module setup (supports both ESM and CJS)
import { preset } from 'presetter';
import hybrid from 'presetter-preset-hybrid';

export default preset('my-hybrid-project', {
  extends: [hybrid],
  variables: {
    target: 'ES2023',
    source: 'src',
    output: 'dist'
  }
});