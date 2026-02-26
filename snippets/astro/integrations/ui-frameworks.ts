// astro.config.mjs - Integrating multiple UI frameworks
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vue from '@astrojs/vue';
import svelte from '@astrojs/svelte';
import solid from '@astrojs/solid-js';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [
    // React integration
    react({
      include: ['**/react/*'],
      experimentalReactChildren: true,
    }),
    
    // Vue integration
    vue({
      include: ['**/vue/*'],
      appEntrypoint: '/src/pages/_app.vue',
    }),
    
    // Svelte integration
    svelte({
      include: ['**/svelte/*'],
    }),
    
    // Solid.js integration
    solid({
      include: ['**/solid/*'],
    }),
    
    // Tailwind CSS
    tailwind({
      applyBaseStyles: false,
      configFile: './tailwind.config.cjs',
    }),
    
    // MDX for enhanced markdown
    mdx({
      syntaxHighlight: 'shiki',
      shikiConfig: {
        theme: 'github-dark',
        langs: ['js', 'ts', 'tsx', 'jsx', 'astro', 'html', 'css'],
        wrap: true,
      },
      gfm: true,
      smartypants: true,
    }),
  ],
  
  // Vite configuration
  vite: {
    ssr: {
      // External packages that should not be bundled for SSR
      external: ['react-dom/server', '@vue/server-renderer'],
    },
    optimizeDeps: {
      // Force pre-bundling of these dependencies
      include: ['react', 'react-dom', 'vue', 'svelte'],
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "src/styles/variables.scss";`,
        },
      },
    },
  },
  
  // Output configuration
  output: 'hybrid', // Enable SSR with prerendering
  adapter: 'node', // or your preferred adapter
  
  // Image optimization
  image: {
    domains: ['images.unsplash.com', 'cdn.example.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
    ],
  },
  
  // Experimental features
  experimental: {
    contentCollectionCache: true,
    optimizeHoistedScript: true,
  },
});

// Example React component usage
// src/components/react/Counter.tsx
import { useState } from 'react';

interface CounterProps {
  initialCount?: number;
  label?: string;
}

export default function Counter({ initialCount = 0, label = 'React Counter' }: CounterProps) {
  const [count, setCount] = useState(initialCount);
  
  return (
    <div className="p-4 border border-blue-500 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">{label}</h3>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setCount(count - 1)}
          className="px-3 py-1 bg-red-500 text-white rounded"
        >
          -
        </button>
        <span className="text-xl font-bold">{count}</span>
        <button 
          onClick={() => setCount(count + 1)}
          className="px-3 py-1 bg-green-500 text-white rounded"
        >
          +
        </button>
      </div>
    </div>
  );
}

// Example Vue component usage
// src/components/vue/TodoList.vue
<template>
  <div class="p-4 border border-green-500 rounded-lg">
    <h3 class="text-lg font-semibold mb-2">{{ title }}</h3>
    
    <form @submit.prevent="addTodo" class="mb-4">
      <input
        v-model="newTodo"
        type="text"
        placeholder="Add a new todo..."
        class="w-full p-2 border rounded"
        required
      />
      <button type="submit" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
        Add Todo
      </button>
    </form>
    
    <ul class="space-y-2">
      <li 
        v-for="todo in todos" 
        :key="todo.id"
        class="flex items-center gap-2"
      >
        <input
          v-model="todo.completed"
          type="checkbox"
          class="rounded"
        />
        <span :class="{ 'line-through text-gray-500': todo.completed }">
          {{ todo.text }}
        </span>
        <button
          @click="removeTodo(todo.id)"
          class="ml-auto px-2 py-1 bg-red-500 text-white text-sm rounded"
        >
          Remove
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface Props {
  title?: string;
  initialTodos?: Todo[];
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Vue Todo List',
  initialTodos: () => [],
});

const newTodo = ref('');
const todos = reactive<Todo[]>([...props.initialTodos]);
let nextId = Math.max(0, ...todos.map(t => t.id)) + 1;

function addTodo() {
  if (newTodo.value.trim()) {
    todos.push({
      id: nextId++,
      text: newTodo.value.trim(),
      completed: false,
    });
    newTodo.value = '';
  }
}

function removeTodo(id: number) {
  const index = todos.findIndex(todo => todo.id === id);
  if (index > -1) {
    todos.splice(index, 1);
  }
}
</script>

// Example Svelte component usage
// src/components/svelte/ImageGallery.svelte
<script lang="ts">
  export let images: Array<{ src: string; alt: string; caption?: string }> = [];
  export let title = 'Svelte Image Gallery';
  
  let selectedIndex = 0;
  let showModal = false;
  
  function openModal(index: number) {
    selectedIndex = index;
    showModal = true;
  }
  
  function closeModal() {
    showModal = false;
  }
  
  function previousImage() {
    selectedIndex = (selectedIndex - 1 + images.length) % images.length;
  }
  
  function nextImage() {
    selectedIndex = (selectedIndex + 1) % images.length;
  }
</script>

<div class="p-4 border border-purple-500 rounded-lg">
  <h3 class="text-lg font-semibold mb-4">{title}</h3>
  
  <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
    {#each images as image, index}
      <button
        on:click={() => openModal(index)}
        class="aspect-square overflow-hidden rounded-lg hover:opacity-80 transition-opacity"
      >
        <img
          src={image.src}
          alt={image.alt}
          class="w-full h-full object-cover"
          loading="lazy"
        />
      </button>
    {/each}
  </div>
</div>

{#if showModal}
  <div 
    class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    on:click={closeModal}
  >
    <div class="relative max-w-4xl max-h-full p-4">
      <img
        src={images[selectedIndex].src}
        alt={images[selectedIndex].alt}
        class="max-w-full max-h-full object-contain"
      />
      
      {#if images[selectedIndex].caption}
        <p class="text-white text-center mt-2">
          {images[selectedIndex].caption}
        </p>
      {/if}
      
      <button
        on:click|stopPropagation={previousImage}
        class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-2xl p-2"
      >
        &#8249;
      </button>
      
      <button
        on:click|stopPropagation={nextImage}
        class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl p-2"
      >
        &#8250;
      </button>
      
      <button
        on:click={closeModal}
        class="absolute top-4 right-4 text-white text-2xl p-2"
      >
        &#10005;
      </button>
    </div>
  </div>
{/if}

<style>
  /* Scoped styles for Svelte component */
  button {
    cursor: pointer;
  }
</style>

// Example Solid.js component usage
// src/components/solid/DataChart.tsx
import { createSignal, createMemo, For } from 'solid-js';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface ChartProps {
  data: DataPoint[];
  title?: string;
  type?: 'bar' | 'pie';
}

export default function DataChart(props: ChartProps) {
  const [hoveredIndex, setHoveredIndex] = createSignal<number | null>(null);
  
  const maxValue = createMemo(() => 
    Math.max(...props.data.map(d => d.value))
  );
  
  const total = createMemo(() =>
    props.data.reduce((sum, d) => sum + d.value, 0)
  );
  
  return (
    <div class="p-4 border border-orange-500 rounded-lg">
      <h3 class="text-lg font-semibold mb-4">
        {props.title || 'Solid.js Data Chart'}
      </h3>
      
      {props.type === 'pie' ? (
        <div class="flex items-center gap-8">
          <svg viewBox="0 0 200 200" class="w-48 h-48">
            <For each={props.data}>
              {(item, index) => {
                const percentage = (item.value / total()) * 100;
                const strokeDasharray = `${percentage * 2.51} 251`;
                const rotation = props.data
                  .slice(0, index())
                  .reduce((acc, d) => acc + (d.value / total()) * 360, 0);
                
                return (
                  <circle
                    cx="100"
                    cy="100"
                    r="40"
                    fill="none"
                    stroke={item.color || `hsl(${index() * 60}, 70%, 50%)`}
                    stroke-width="20"
                    stroke-dasharray={strokeDasharray}
                    style={`transform: rotate(${rotation}deg); transform-origin: 100px 100px;`}
                    onMouseEnter={() => setHoveredIndex(index())}
                    onMouseLeave={() => setHoveredIndex(null)}
                    class="transition-all duration-200 hover:stroke-width-[25]"
                  />
                );
              }}
            </For>
          </svg>
          
          <div class="space-y-2">
            <For each={props.data}>
              {(item, index) => (
                <div 
                  class="flex items-center gap-2 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index())}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div
                    class="w-4 h-4 rounded"
                    style={{
                      'background-color': item.color || `hsl(${index() * 60}, 70%, 50%)`,
                      transform: hoveredIndex() === index() ? 'scale(1.2)' : 'scale(1)',
                    }}
                  />
                  <span class={hoveredIndex() === index() ? 'font-semibold' : ''}>
                    {item.label}: {item.value}
                  </span>
                </div>
              )}
            </For>
          </div>
        </div>
      ) : (
        <div class="space-y-2">
          <For each={props.data}>
            {(item, index) => (
              <div class="space-y-1">
                <div class="flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.value / maxValue()) * 100}%`,
                      'background-color': item.color || `hsl(${index() * 60}, 70%, 50%)`,
                      transform: hoveredIndex() === index() ? 'scaleY(1.2)' : 'scaleY(1)',
                    }}
                    onMouseEnter={() => setHoveredIndex(index())}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </div>
              </div>
            )}
          </For>
        </div>
      )}
    </div>
  );
}