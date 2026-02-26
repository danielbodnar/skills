// Vue integration with Oxc tools

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { transform } from 'oxc-transform';
import { execSync } from 'node:child_process';

/**
 * Vite plugin for oxc linting during development
 */
export const oxcLintPlugin = () => {
  return {
    name: 'oxc-lint',
    buildStart() {
      console.log('Running oxlint...');
      try {
        execSync('oxlint src/', { stdio: 'inherit' });
        console.log('✓ Oxlint passed');
      } catch (error) {
        console.error('✗ Oxlint failed');
        throw error;
      }
    },
    handleHotUpdate({ file, server }) {
      // Lint on file change
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.vue')) {
        try {
          execSync(`oxlint ${file}`, { stdio: 'pipe' });
        } catch (error) {
          server.ws.send({
            type: 'error',
            err: {
              message: `Linting error in ${file}`,
              stack: error.message
            }
          });
        }
      }
    }
  };
};

/**
 * Vite plugin for oxc-transform integration
 */
export const oxcTransformPlugin = () => {
  return {
    name: 'oxc-transform',
    transform(code, id) {
      // Only transform TypeScript files (Vue SFC <script> blocks are handled by Vue plugin)
      if (id.endsWith('.ts') && !id.endsWith('.d.ts')) {
        try {
          const result = transform(id, code, {
            typescript: {
              onlyRemoveTypeImports: true,
              declaration: false
            }
          });
          
          return {
            code: result.code,
            map: null // TODO: Add source map support
          };
        } catch (error) {
          console.error(`Transform failed for ${id}:`, error);
          throw error;
        }
      }
    }
  };
};

/**
 * Complete Vite configuration with Vue and Oxc
 */
export const viteConfig = defineConfig({
  plugins: [
    vue({
      script: {
        // Use oxc for TypeScript in Vue SFC
        defineModel: true,
        propsDestructure: true
      }
    }),
    oxcLintPlugin(),
    oxcTransformPlugin()
  ],
  
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue'],
          utils: ['@/utils/index']
        }
      }
    }
  },
  
  server: {
    port: 3000,
    open: true
  }
});

/**
 * Nuxt configuration with Oxc integration
 */
export const nuxtConfig = {
  // Enable TypeScript support
  typescript: {
    typeCheck: false // We'll use oxc for type checking
  },
  
  // Vite configuration
  vite: {
    plugins: [
      oxcLintPlugin(),
      oxcTransformPlugin()
    ]
  },
  
  // Build hooks
  hooks: {
    'build:before': () => {
      console.log('Running oxlint before build...');
      try {
        execSync('oxlint', { stdio: 'inherit' });
      } catch (error) {
        throw new Error('Linting failed, aborting build');
      }
    }
  },
  
  // Nitro configuration
  nitro: {
    esbuild: {
      options: {
        // Use oxc for faster builds (when available)
        tsconfigRaw: {
          compilerOptions: {
            experimentalDecorators: true
          }
        }
      }
    }
  }
};

/**
 * Vue component with TypeScript and oxc-friendly patterns
 */
export const exampleVueComponent = `
<template>
  <div class="counter">
    <h2>{{ title }}</h2>
    <p>Count: {{ count }}</p>
    <div class="buttons">
      <button @click="increment" :disabled="isLoading">
        {{ isLoading ? 'Loading...' : 'Increment' }}
      </button>
      <button @click="decrement" :disabled="isLoading">
        Decrement
      </button>
      <button @click="reset">Reset</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// Props with proper TypeScript typing
interface Props {
  initialValue?: number;
  title?: string;
  maxValue?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialValue: 0,
  title: 'Counter',
  maxValue: 100
});

// Emits
const emit = defineEmits<{
  countChanged: [value: number];
  maxReached: [];
}>();

// Reactive state
const count = ref(props.initialValue);
const isLoading = ref(false);

// Computed properties
const isMaxReached = computed(() => count.value >= props.maxValue);
const canIncrement = computed(() => !isMaxReached.value && !isLoading.value);

// Methods
const increment = async () => {
  if (!canIncrement.value) return;
  
  isLoading.value = true;
  
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 500));
  
  count.value++;
  emit('countChanged', count.value);
  
  if (isMaxReached.value) {
    emit('maxReached');
  }
  
  isLoading.value = false;
};

const decrement = () => {
  if (count.value > 0) {
    count.value--;
    emit('countChanged', count.value);
  }
};

const reset = () => {
  count.value = props.initialValue;
  emit('countChanged', count.value);
};

// Lifecycle
onMounted(() => {
  console.log('Counter component mounted');
});
</script>

<style scoped>
.counter {
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  max-width: 300px;
}

.buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

button {
  padding: 0.5rem 1rem;
  border: 1px solid #007acc;
  background: #007acc;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

button:hover:not(:disabled) {
  background: #005a9e;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
`;

/**
 * Composable with oxc-friendly TypeScript patterns
 */
export const useCounterComposable = `
// composables/useCounter.ts
import { ref, computed, type Ref } from 'vue';

export interface CounterOptions {
  initialValue?: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface CounterReturn {
  count: Ref<number>;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  canIncrement: Ref<boolean>;
  canDecrement: Ref<boolean>;
  isAtMin: Ref<boolean>;
  isAtMax: Ref<boolean>;
}

export const useCounter = (options: CounterOptions = {}): CounterReturn => {
  const {
    initialValue = 0,
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY,
    step = 1
  } = options;

  const count = ref(initialValue);

  const canIncrement = computed(() => count.value + step <= max);
  const canDecrement = computed(() => count.value - step >= min);
  const isAtMin = computed(() => count.value <= min);
  const isAtMax = computed(() => count.value >= max);

  const increment = () => {
    if (canIncrement.value) {
      count.value += step;
    }
  };

  const decrement = () => {
    if (canDecrement.value) {
      count.value -= step;
    }
  };

  const reset = () => {
    count.value = initialValue;
  };

  return {
    count,
    increment,
    decrement,
    reset,
    canIncrement,
    canDecrement,
    isAtMin,
    isAtMax
  };
};
`;

/**
 * Build script for Vue project with oxc
 */
export const buildVueProject = async () => {
  console.log('Building Vue project with oxc...');
  
  // Run linting first
  try {
    execSync('oxlint src/', { stdio: 'inherit' });
    console.log('✓ Linting passed');
  } catch (error) {
    console.error('✗ Linting failed');
    process.exit(1);
  }
  
  // Run type checking with oxc-transform
  try {
    execSync('oxc-transform --check src/', { stdio: 'inherit' });
    console.log('✓ Type checking passed');
  } catch (error) {
    console.error('✗ Type checking failed');
    process.exit(1);
  }
  
  // Build with Vite
  try {
    execSync('vite build', { stdio: 'inherit' });
    console.log('✓ Build completed');
  } catch (error) {
    console.error('✗ Build failed');
    process.exit(1);
  }
};

// Export for usage in vite.config.ts or nuxt.config.ts
export default viteConfig;