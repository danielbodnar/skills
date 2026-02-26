// Advanced Nuxt 4 configuration examples

// 1. Comprehensive nuxt.config.ts
export default defineNuxtConfig({
  // Experimental features for Nuxt 4
  experimental: {
    asyncContext: true,
    componentIslands: true,
    cookieStore: true,
    crossOriginPrefetch: false,
    buildCache: true,
    inlineRouteRules: true
  },
  
  // Future compatibility
  compatibilityDate: '2024-07-17',
  
  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: true
  },
  
  // Runtime configuration
  runtimeConfig: {
    // Private keys (server-only)
    apiSecret: process.env.NUXT_API_SECRET,
    databaseUrl: process.env.NUXT_DATABASE_URL,
    jwtSecret: process.env.NUXT_JWT_SECRET,
    
    // Public keys (client and server)
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      appName: 'My Nuxt App'
    }
  },
  
  // Route rules for hybrid rendering
  routeRules: {
    // Homepage pre-rendered at build time
    '/': { prerender: true },
    
    // Admin dashboard rendered only on client-side
    '/admin/**': { ssr: false },
    
    // Blog posts incremental static regeneration
    '/blog/**': { isr: 3600 },
    
    // API routes with CORS
    '/api/**': { 
      cors: true,
      headers: { 'cache-control': 's-maxage=300' }
    },
    
    // Redirects
    '/old-page': { redirect: '/new-page' }
  },
  
  // CSS configuration
  css: [
    '~/assets/css/main.css',
    '@/assets/scss/variables.scss'
  ],
  
  // Modules
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/content',
    '@nuxt/image',
    '@pinia/nuxt',
    '@nuxtjs/google-fonts',
    '@vueuse/nuxt'
  ],
  
  // Component configuration
  components: [
    {
      path: '~/components',
      pathPrefix: false
    },
    {
      path: '~/components/ui',
      prefix: 'Ui'
    }
  ],
  
  // Import configuration
  imports: {
    dirs: [
      'composables/**',
      'utils/**',
      'stores/**'
    ]
  },
  
  // Build configuration
  build: {
    transpile: ['trpc-nuxt']
  },
  
  // Vite configuration
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/_colors.scss" as *;'
        }
      }
    }
  },
  
  // Nitro configuration
  nitro: {
    storage: {
      redis: {
        driver: 'redis',
        port: 6379,
        host: '127.0.0.1',
        username: '',
        password: '',
        db: 0
      }
    },
    experimental: {
      wasm: true
    }
  },
  
  // App configuration
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1'
    }
  },
  
  // Development configuration
  devtools: { 
    enabled: true,
    timeline: {
      enabled: true
    }
  }
})

// 2. Multi-environment configuration
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

export default defineNuxtConfig({
  // Conditional configuration based on environment
  ssr: isProduction,
  
  // Development-only modules
  ...(isDevelopment && {
    modules: ['@nuxt/devtools']
  }),
  
  // Production optimizations
  ...(isProduction && {
    nitro: {
      minify: true,
      compressPublicAssets: true
    }
  })
})

// 3. Tailwind CSS configuration (tailwind.config.js)
/*
module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
    "./app.vue"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a'
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}
*/

// 4. PostCSS configuration (postcss.config.js)
/*
module.exports = {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {}
  }
}
*/

// 5. TypeScript configuration (tsconfig.json)
/*
{
  "extends": "./.nuxt/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
*/

// 6. App configuration (app.config.ts)
export default defineAppConfig({
  theme: {
    primaryColor: 'blue',
    darkMode: 'class'
  },
  
  ui: {
    primary: 'blue',
    gray: 'slate'
  },
  
  seo: {
    siteName: 'My Nuxt App',
    siteDescription: 'A modern web application built with Nuxt 4'
  }
})

// 7. Pinia store configuration (stores/index.ts)
export const useMainStore = defineStore('main', () => {
  const count = ref(0)
  const name = ref('Nuxt')
  
  const doubledCount = computed(() => count.value * 2)
  
  function increment() {
    count.value++
  }
  
  return { count, name, doubledCount, increment }
})

// 8. Content configuration for @nuxt/content
/*
// nuxt.config.ts
export default defineNuxtConfig({
  content: {
    highlight: {
      theme: {
        default: 'github-light',
        dark: 'github-dark'
      },
      preload: ['typescript', 'vue', 'bash']
    },
    markdown: {
      toc: {
        depth: 5,
        searchDepth: 5
      }
    }
  }
})
*/

// 9. Image optimization configuration
/*
// nuxt.config.ts
export default defineNuxtConfig({
  image: {
    provider: 'ipx',
    quality: 80,
    format: ['webp'],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536
    }
  }
})
*/

// 10. PWA configuration (with @vite-pwa/nuxt)
/*
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@vite-pwa/nuxt'],
  
  pwa: {
    registerType: 'autoUpdate',
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}']
    },
    client: {
      installPrompt: true
    },
    devOptions: {
      enabled: true,
      type: 'module'
    }
  }
})
*/