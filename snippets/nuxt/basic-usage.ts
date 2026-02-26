// Basic Nuxt 4 project setup and initialization examples

// 1. Create new Nuxt project
// bun create nuxt@latest my-nuxt-app
// cd my-nuxt-app
// bun install
// bun run dev

// 2. Basic nuxt.config.ts
export default defineNuxtConfig({
  // TypeScript support
  typescript: {
    strict: true,
    typeCheck: true
  },
  
  // Development configuration
  devtools: { enabled: true },
  
  // CSS framework
  css: ['~/assets/css/main.css'],
  
  // Auto-imports
  imports: {
    autoImport: true
  },
  
  // Component auto-registration
  components: {
    global: true,
    dirs: ['~/components']
  }
})

// 3. Basic page component (pages/index.vue)
/*
<template>
  <div>
    <h1>Welcome to Nuxt 4</h1>
    <p>{{ greeting }}</p>
    <NuxtLink to="/about">About Page</NuxtLink>
  </div>
</template>

<script setup lang="ts">
const greeting = ref('Hello from Nuxt!')

// SEO Meta
useHead({
  title: 'Home Page',
  meta: [
    { name: 'description', content: 'Welcome to our Nuxt 4 application' }
  ]
})
</script>
*/

// 4. Basic composable (composables/useCounter.ts)
export const useCounter = () => {
  const count = ref(0)
  
  const increment = () => count.value++
  const decrement = () => count.value--
  const reset = () => count.value = 0
  
  return {
    count: readonly(count),
    increment,
    decrement,
    reset
  }
}

// 5. Basic API route (server/api/hello.get.ts)
export default defineEventHandler(async (event) => {
  return {
    message: 'Hello from Nuxt API!',
    timestamp: new Date().toISOString()
  }
})

// 6. Basic middleware (middleware/auth.ts)
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  
  if (!user.value) {
    return navigateTo('/login')
  }
})

// 7. Basic plugin (plugins/api.client.ts)
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  const $api = $fetch.create({
    baseURL: config.public.apiBase
  })
  
  return {
    provide: {
      api: $api
    }
  }
})

// 8. Basic layout (layouts/default.vue)
/*
<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow">
      <nav class="container mx-auto px-4 py-4">
        <NuxtLink to="/" class="text-xl font-bold">My App</NuxtLink>
      </nav>
    </header>
    
    <main class="container mx-auto px-4 py-8">
      <slot />
    </main>
    
    <footer class="bg-gray-800 text-white py-8">
      <div class="container mx-auto px-4 text-center">
        <p>&copy; 2024 My App. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>
*/

// 9. Environment configuration (.env)
/*
# Public variables (accessible on client)
NUXT_PUBLIC_API_BASE=http://localhost:3000/api
NUXT_PUBLIC_SITE_URL=http://localhost:3000

# Private variables (server-only)
NUXT_API_SECRET=your-secret-key
NUXT_DATABASE_URL=postgresql://user:pass@localhost:5432/db
*/

// 10. Package.json scripts
/*
{
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "typecheck": "nuxt typecheck",
    "lint": "bunx biome check .",
    "lint:fix": "bunx biome check --write ."
  }
}
*/