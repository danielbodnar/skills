// Nuxt 4 module development patterns and examples

// 1. Basic Nuxt module (modules/hello/index.ts)
import { defineNuxtModule, createResolver, addImports, addComponent } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'hello-module',
    configKey: 'hello',
    compatibility: {
      nuxt: '^3.0.0 || ^4.0.0'
    }
  },
  
  defaults: {
    greeting: 'Hello',
    enabled: true
  },
  
  setup(options, nuxt) {
    if (!options.enabled) return
    
    const resolver = createResolver(import.meta.url)
    
    // Add a composable
    addImports({
      name: 'useHello',
      as: 'useHello',
      from: resolver.resolve('./runtime/composables/useHello')
    })
    
    // Add a component
    addComponent({
      name: 'HelloWorld',
      filePath: resolver.resolve('./runtime/components/HelloWorld.vue')
    })
    
    console.log(`${options.greeting} from Nuxt module!`)
  }
})

// 2. Advanced module with plugin injection (modules/api/index.ts)
import { defineNuxtModule, createResolver, addPlugin, addImports } from '@nuxt/kit'

interface ModuleOptions {
  baseURL: string
  timeout: number
  retries: number
  enableMocking: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'api-module',
    configKey: 'api'
  },
  
  defaults: {
    baseURL: '/api',
    timeout: 10000,
    retries: 3,
    enableMocking: false
  },
  
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    
    // Add runtime config
    nuxt.options.runtimeConfig.api = {
      baseURL: options.baseURL,
      timeout: options.timeout,
      retries: options.retries
    }
    
    nuxt.options.runtimeConfig.public.api = {
      baseURL: options.baseURL
    }
    
    // Add plugin
    addPlugin({
      src: resolver.resolve('./runtime/plugins/api.client'),
      mode: 'client'
    })
    
    addPlugin({
      src: resolver.resolve('./runtime/plugins/api.server'),
      mode: 'server'
    })
    
    // Add composables
    addImports([
      {
        name: 'useApiClient',
        as: 'useApiClient',
        from: resolver.resolve('./runtime/composables/useApiClient')
      },
      {
        name: 'useApiCache',
        as: 'useApiCache',
        from: resolver.resolve('./runtime/composables/useApiCache')
      }
    ])
    
    // Development-only features
    if (nuxt.options.dev && options.enableMocking) {
      addPlugin({
        src: resolver.resolve('./runtime/plugins/mock-api'),
        mode: 'client'
      })
    }
  }
})

// 3. Module with server handlers (modules/auth/index.ts)
import { defineNuxtModule, createResolver, addServerHandler, addImports } from '@nuxt/kit'

interface AuthModuleOptions {
  jwt: {
    secret: string
    expiresIn: string
  }
  providers: {
    local: boolean
    github: boolean
    google: boolean
  }
}

export default defineNuxtModule<AuthModuleOptions>({
  meta: {
    name: 'auth-module',
    configKey: 'auth'
  },
  
  defaults: {
    jwt: {
      secret: '',
      expiresIn: '7d'
    },
    providers: {
      local: true,
      github: false,
      google: false
    }
  },
  
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    
    // Validate required options
    if (!options.jwt.secret) {
      throw new Error('JWT secret is required for auth module')
    }
    
    // Add server handlers
    addServerHandler({
      route: '/api/auth/login',
      handler: resolver.resolve('./runtime/server/api/auth/login.post')
    })
    
    addServerHandler({
      route: '/api/auth/logout',
      handler: resolver.resolve('./runtime/server/api/auth/logout.post')
    })
    
    addServerHandler({
      route: '/api/auth/me',
      handler: resolver.resolve('./runtime/server/api/auth/me.get')
    })
    
    // Add OAuth handlers if enabled
    if (options.providers.github) {
      addServerHandler({
        route: '/api/auth/github',
        handler: resolver.resolve('./runtime/server/api/auth/github.get')
      })
    }
    
    if (options.providers.google) {
      addServerHandler({
        route: '/api/auth/google',
        handler: resolver.resolve('./runtime/server/api/auth/google.get')
      })
    }
    
    // Add middleware
    addServerHandler({
      route: '/api/auth/middleware/verify',
      handler: resolver.resolve('./runtime/server/middleware/auth')
    })
    
    // Add composables
    addImports([
      {
        name: 'useAuth',
        as: 'useAuth',
        from: resolver.resolve('./runtime/composables/useAuth')
      },
      {
        name: 'useUser',
        as: 'useUser',
        from: resolver.resolve('./runtime/composables/useUser')
      }
    ])
    
    // Configure runtime
    nuxt.options.runtimeConfig.auth = {
      jwtSecret: options.jwt.secret,
      jwtExpiresIn: options.jwt.expiresIn
    }
  }
})

// 4. Module with CSS and asset injection (modules/ui/index.ts)
import { defineNuxtModule, createResolver, addComponentsDir, installModule } from '@nuxt/kit'

interface UIModuleOptions {
  theme: 'light' | 'dark' | 'auto'
  cssFramework: 'tailwind' | 'bootstrap' | 'none'
  icons: boolean
}

export default defineNuxtModule<UIModuleOptions>({
  meta: {
    name: 'ui-module',
    configKey: 'ui'
  },
  
  defaults: {
    theme: 'auto',
    cssFramework: 'tailwind',
    icons: true
  },
  
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    
    // Add CSS based on framework choice
    if (options.cssFramework === 'tailwind') {
      await installModule('@nuxtjs/tailwindcss', {
        configPath: resolver.resolve('./runtime/tailwind.config.js')
      })
    } else if (options.cssFramework === 'bootstrap') {
      nuxt.options.css.push('bootstrap/dist/css/bootstrap.min.css')
    }
    
    // Add base styles
    nuxt.options.css.push(resolver.resolve('./runtime/assets/css/base.css'))
    
    // Add theme-specific styles
    if (options.theme !== 'auto') {
      nuxt.options.css.push(resolver.resolve(`./runtime/assets/css/theme-${options.theme}.css`))
    }
    
    // Add components
    addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      prefix: 'Ui',
      pathPrefix: false
    })
    
    // Add icons if enabled
    if (options.icons) {
      await installModule('@nuxt/icon', {
        collections: ['heroicons', 'lucide']
      })
    }
    
    // Add theme configuration to app config
    nuxt.options.appConfig = nuxt.options.appConfig || {}
    nuxt.options.appConfig.ui = {
      theme: options.theme,
      cssFramework: options.cssFramework
    }
  }
})

// 5. Module with build-time transformations (modules/optimizer/index.ts)
import { defineNuxtModule, createResolver } from '@nuxt/kit'

interface OptimizerOptions {
  removeConsole: boolean
  removeComments: boolean
  minifyCSS: boolean
  optimizeImages: boolean
}

export default defineNuxtModule<OptimizerOptions>({
  meta: {
    name: 'optimizer-module',
    configKey: 'optimizer'
  },
  
  defaults: {
    removeConsole: true,
    removeComments: true,
    minifyCSS: true,
    optimizeImages: true
  },
  
  setup(options, nuxt) {
    // Only apply optimizations in production
    if (!nuxt.options.dev) {
      // Configure Vite optimizations
      nuxt.options.vite = nuxt.options.vite || {}
      nuxt.options.vite.build = nuxt.options.vite.build || {}
      
      if (options.removeConsole) {
        nuxt.options.vite.build.terserOptions = {
          compress: {
            drop_console: true
          }
        }
      }
      
      if (options.minifyCSS) {
        nuxt.options.vite.build.cssMinify = true
      }
      
      // Configure Nitro optimizations
      nuxt.options.nitro = nuxt.options.nitro || {}
      nuxt.options.nitro.minify = true
      
      if (options.optimizeImages) {
        nuxt.options.nitro.compressPublicAssets = true
      }
    }
  }
})

// 6. Module with external dependency management (modules/database/index.ts)
import { defineNuxtModule, createResolver, addServerHandler, installModule } from '@nuxt/kit'

interface DatabaseOptions {
  provider: 'postgresql' | 'mysql' | 'sqlite'
  url: string
  migrations: boolean
  seedData: boolean
}

export default defineNuxtModule<DatabaseOptions>({
  meta: {
    name: 'database-module',
    configKey: 'database'
  },
  
  defaults: {
    provider: 'postgresql',
    url: '',
    migrations: true,
    seedData: false
  },
  
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    
    if (!options.url) {
      throw new Error('Database URL is required')
    }
    
    // Install ORM based on provider
    switch (options.provider) {
      case 'postgresql':
        await installModule('drizzle-orm', {
          driver: 'postgres'
        })
        break
      case 'mysql':
        await installModule('drizzle-orm', {
          driver: 'mysql2'
        })
        break
      case 'sqlite':
        await installModule('drizzle-orm', {
          driver: 'better-sqlite3'
        })
        break
    }
    
    // Add database utilities
    addServerHandler({
      route: '/api/_db/health',
      handler: resolver.resolve('./runtime/server/api/db/health.get')
    })
    
    if (options.migrations) {
      addServerHandler({
        route: '/api/_db/migrate',
        handler: resolver.resolve('./runtime/server/api/db/migrate.post')
      })
    }
    
    // Configure runtime
    nuxt.options.runtimeConfig.database = {
      url: options.url,
      provider: options.provider
    }
    
    // Development setup
    if (nuxt.options.dev) {
      // Auto-run migrations in development
      nuxt.hook('nitro:init', async () => {
        if (options.migrations) {
          console.log('Running database migrations...')
          // Migration logic would go here
        }
        
        if (options.seedData) {
          console.log('Seeding database...')
          // Seeding logic would go here
        }
      })
    }
  }
})

// 7. Module with custom hooks (modules/analytics/index.ts)
import { defineNuxtModule, createResolver, addPlugin } from '@nuxt/kit'

interface AnalyticsOptions {
  providers: {
    google?: { id: string }
    plausible?: { domain: string }
    fathom?: { siteId: string }
  }
  trackPageViews: boolean
  trackEvents: boolean
  debug: boolean
}

export default defineNuxtModule<AnalyticsOptions>({
  meta: {
    name: 'analytics-module',
    configKey: 'analytics'
  },
  
  defaults: {
    providers: {},
    trackPageViews: true,
    trackEvents: true,
    debug: false
  },
  
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    
    // Add analytics configuration to runtime config
    nuxt.options.runtimeConfig.public.analytics = options
    
    // Add analytics plugin
    addPlugin({
      src: resolver.resolve('./runtime/plugins/analytics.client'),
      mode: 'client'
    })
    
    // Register custom hooks
    nuxt.hook('app:mounted', () => {
      if (options.debug) {
        console.log('Analytics module initialized')
      }
    })
    
    // Add route change tracking
    if (options.trackPageViews) {
      nuxt.hook('app:beforeMount', () => {
        // Page view tracking setup
      })
    }
  }
})

// 8. Module with TypeScript integration (modules/types/index.ts)
import { defineNuxtModule, createResolver, addTypeTemplate } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'types-module',
    configKey: 'types'
  },
  
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    
    // Add custom type definitions
    addTypeTemplate({
      filename: 'types/custom.d.ts',
      getContents: () => `
        declare global {
          interface Window {
            gtag?: (...args: any[]) => void
            plausible?: (...args: any[]) => void
          }
        }
        
        export interface CustomUser {
          id: string
          email: string
          name: string
          avatar?: string
          role: 'admin' | 'user' | 'moderator'
        }
        
        export interface ApiResponse<T = any> {
          success: boolean
          data?: T
          error?: string
          message?: string
        }
      `
    })
    
    // Extend app config types
    addTypeTemplate({
      filename: 'types/app-config.d.ts',
      getContents: () => `
        declare module '@nuxt/schema' {
          interface AppConfigInput {
            myModule?: {
              theme: 'light' | 'dark'
              apiUrl: string
            }
          }
        }
      `
    })
  }
})

// 9. Testing utilities for modules (modules/testing/index.ts)
import { defineNuxtModule, createResolver, addImports } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'testing-module',
    configKey: 'testing'
  },
  
  setup(options, nuxt) {
    // Only load in development or test environment
    if (nuxt.options.dev || process.env.NODE_ENV === 'test') {
      const resolver = createResolver(import.meta.url)
      
      // Add testing utilities
      addImports([
        {
          name: 'createMockUser',
          as: 'createMockUser',
          from: resolver.resolve('./runtime/utils/testing')
        },
        {
          name: 'mockApiResponse',
          as: 'mockApiResponse',
          from: resolver.resolve('./runtime/utils/testing')
        }
      ])
      
      // Add test data seeding in development
      if (nuxt.options.dev) {
        nuxt.hook('nitro:init', async () => {
          console.log('Setting up test data...')
        })
      }
    }
  }
})

// 10. Module configuration schema validation
import { defineNuxtModule } from '@nuxt/kit'
import { z } from 'zod'

const moduleSchema = z.object({
  enabled: z.boolean().default(true),
  apiKey: z.string().min(1, 'API key is required'),
  endpoints: z.object({
    base: z.string().url(),
    timeout: z.number().min(1000).max(30000).default(10000)
  }),
  features: z.array(z.enum(['auth', 'payments', 'notifications'])).default(['auth'])
})

type ModuleOptions = z.infer<typeof moduleSchema>

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'validated-module',
    configKey: 'validatedModule'
  },
  
  setup(options, nuxt) {
    // Validate options against schema
    try {
      const validatedOptions = moduleSchema.parse(options)
      
      if (!validatedOptions.enabled) {
        return
      }
      
      // Module setup with validated options
      console.log('Module setup with valid configuration')
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ')
        
        throw new Error(`Module configuration error: ${errorMessages}`)
      }
      throw error
    }
  }
})