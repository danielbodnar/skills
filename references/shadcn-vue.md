# shadcn-vue Reference

**Always remember to reference @$HOME/.claude/references/shadcn-vue.md and look for snippets and examples in @$HOME/.claude/snippets/shadcn-vue/**

## Quick Reference

- Installation: `npx shadcn-vue@latest init`
- Add Component: `npx shadcn-vue@latest add button`
- Import: `import { Button } from '@/components/ui/button'`
- Documentation: <https://www.shadcn-vue.com>
- GitHub: <https://github.com/unovue/shadcn-vue>
- Package: <https://www.npmjs.com/package/shadcn-vue>

## Resources and Documentation

- [shadcn-vue Documentation](https://www.shadcn-vue.com)
  - [Introduction](https://www.shadcn-vue.com/docs/introduction)
  - [Installation](https://www.shadcn-vue.com/docs/installation)
    - [Vite Installation](https://www.shadcn-vue.com/docs/installation/vite)
    - [Nuxt Installation](https://www.shadcn-vue.com/docs/installation/nuxt)
    - [Astro Installation](https://www.shadcn-vue.com/docs/installation/astro)
    - [Manual Installation](https://www.shadcn-vue.com/docs/installation/manual)
  - [Components](https://www.shadcn-vue.com/docs/components)
    - [UI Components](https://www.shadcn-vue.com/docs/components/accordion)
    - [Form Components](https://www.shadcn-vue.com/docs/components/form)
    - [Data Display](https://www.shadcn-vue.com/docs/components/data-table)
    - [Charts](https://www.shadcn-vue.com/docs/charts)
  - [Configuration](https://www.shadcn-vue.com/docs/components-json)
  - [CLI Reference](https://www.shadcn-vue.com/docs/cli)
  - [Theming](https://www.shadcn-vue.com/docs/theming)
  - [Dark Mode](https://www.shadcn-vue.com/docs/dark-mode)
  - [Examples](https://www.shadcn-vue.com/examples)
- [Community Resources](https://github.com/unovue/shadcn-vue)
  - [GitHub Repository](https://github.com/unovue/shadcn-vue)
  - [Issue Tracker](https://github.com/unovue/shadcn-vue/issues)
  - [Discussions](https://github.com/unovue/shadcn-vue/discussions)
  - [Contributing Guide](https://github.com/unovue/shadcn-vue/blob/main/CONTRIBUTING.md)

## Core Concepts

### Copy-Paste Architecture

- **Not an NPM Package**: Components are copied directly into your codebase
- **Full Ownership**: You own and control the component code
- **Customization**: Modify components to match your design system
- **No Lock-in**: No dependency on external package updates

### Built on Modern Stack

- **Vue 3**: Composition API and `<script setup>` syntax
- **TypeScript**: Full TypeScript support with strict types
- **Tailwind CSS v4**: Modern utility-first styling with `@tailwindcss/vite` plugin
- **Reka UI**: Accessible primitives and interactions
- **Lucide Icons**: Beautiful SVG icon library

### Accessibility First

- **WAI-ARIA Compliant**: Follows accessibility design patterns
- **Keyboard Navigation**: Full keyboard support for all components
- **Screen Reader Support**: Proper labeling and descriptions
- **Focus Management**: Logical focus flow and indicators

## Installation Methods

### Framework-Specific Setup

#### Vite + Vue Setup

```bash
# Create new Vue project
npm create vite@latest my-vue-app -- --template vue-ts
cd my-vue-app

# Install Tailwind CSS v4 with Vite plugin
npm install tailwindcss @tailwindcss/vite
npm install -D @types/node

# Initialize shadcn-vue
npx shadcn-vue@latest init
```

#### Nuxt Setup

```bash
# Create Nuxt project
npx nuxi@latest init my-nuxt-app
cd my-nuxt-app

# Install TypeScript (workaround for Nuxt error)
npm install -D typescript

# Install Tailwind CSS
npm install tailwindcss @tailwindcss/vite

# Initialize shadcn-vue
npx shadcn-vue@latest init
```

#### Astro Setup

```bash
# Create Astro project with Vue and Tailwind
npx create-astro@latest astro-app --template with-tailwindcss --install --add vue --git
cd astro-app

# Initialize shadcn-vue
npx shadcn-vue@latest init
```

### Manual Installation

```bash
# Install required dependencies
npm install class-variance-authority clsx tailwind-merge lucide-vue-next tw-animate-css

# Initialize project configuration
npx shadcn-vue@latest init
```

## Configuration

### components.json Schema

```json
{
  "$schema": "https://shadcn-vue.com/schema.json",
  "style": "new-york",
  "typescript": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "composables": "@/composables",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib"
  },
  "iconLibrary": "lucide"
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Core Components

### Basic UI Components

- **Button**: Primary, secondary, destructive, ghost, link variants
- **Input**: Text inputs with validation states
- **Label**: Form labels with accessibility
- **Badge**: Status indicators and tags
- **Avatar**: User profile pictures with fallbacks
- **Alert**: Contextual feedback messages

### Layout Components

- **Card**: Content containers with header, body, footer
- **Sheet**: Slide-out panels and sidebars
- **Dialog**: Modal dialogs and overlays
- **Popover**: Floating content containers
- **Accordion**: Collapsible content sections
- **Separator**: Visual content dividers

### Form Components

- **Form**: Form validation and field management
- **Checkbox**: Boolean input controls
- **Switch**: Toggle switches
- **Select**: Dropdown select menus
- **Combobox**: Searchable select inputs
- **Date Picker**: Calendar-based date selection
- **Auto Form**: Dynamic forms from Zod schemas

### Data Display

- **Table**: Data tables with sorting and filtering
- **Data Table**: Advanced tables with TanStack Table
- **Pagination**: Page navigation controls
- **Carousel**: Image and content sliders
- **Tabs**: Tabbed content organization

### Navigation

- **Navigation Menu**: Hierarchical navigation
- **Menubar**: Menu bars with dropdowns
- **Breadcrumb**: Navigation breadcrumbs
- **Command**: Command palette and search

### Charts (Vue 3.3+ Required)

- **Area Chart**: Filled line charts
- **Line Chart**: Line graphs and trends
- **Donut Chart**: Circular progress indicators
- **Bar Chart**: Column and bar visualizations

## Default Usage Patterns

### Component Installation

```bash
# Add individual components
npx shadcn-vue@latest add button
npx shadcn-vue@latest add input
npx shadcn-vue@latest add form

# Add multiple components
npx shadcn-vue@latest add button input form dialog
```

### Basic Component Usage

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
</script>

<template>
  <div class="space-y-4">
    <div>
      <Label for="email">Email</Label>
      <Input id="email" type="email" placeholder="Enter your email" />
    </div>
    <Button>Submit</Button>
  </div>
</template>
```

### Form Integration

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const email = ref('')
const isLoading = ref(false)

const handleSubmit = async () => {
  isLoading.value = true
  // Handle form submission
  isLoading.value = false
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <Label for="email">Email Address</Label>
      <Input 
        id="email" 
        v-model="email"
        type="email" 
        placeholder="you@example.com"
        required
      />
    </div>
    <Button type="submit" :disabled="isLoading">
      {{ isLoading ? 'Signing in...' : 'Sign in' }}
    </Button>
  </form>
</template>
```

## Theming and Customization

### CSS Variables Approach (Recommended)

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96.1%;
  --secondary-foreground: 0 0% 9%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 0 0% 3.9%;
  --radius: 0.5rem;
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 0 0% 9%;
  --secondary: 0 0% 14.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 0 0% 14.9%;
  --muted-foreground: 0 0% 63.9%;
  --accent: 0 0% 14.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 14.9%;
  --input: 0 0% 14.9%;
  --ring: 0 0% 83.1%;
}
```

### Custom Color Extensions

```css
:root {
  --warning: 38 92% 50%;
  --warning-foreground: 48 96% 89%;
}

.dark {
  --warning: 48 96% 89%;
  --warning-foreground: 38 92% 50%;
}
```

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        warning: 'hsl(var(--warning))',
        'warning-foreground': 'hsl(var(--warning-foreground))'
      }
    }
  }
}
```

## Advanced Patterns

### Component Composition

```vue
<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
</script>

<template>
  <Card class="w-[380px]">
    <CardHeader>
      <div class="flex items-center space-x-2">
        <CardTitle>Project Status</CardTitle>
        <Badge variant="secondary">Active</Badge>
      </div>
      <CardDescription>
        Track your project progress and milestones
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium">Completion</span>
        <span class="text-sm text-muted-foreground">75%</span>
      </div>
      <div class="flex space-x-2">
        <Button size="sm" variant="outline">View Details</Button>
        <Button size="sm">Update Status</Button>
      </div>
    </CardContent>
  </Card>
</template>
```

### Data Table Implementation

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useVueTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/vue-table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const data = ref([
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'Active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
])

const columns: ColumnDef<any>[] = [
  {
    id: 'select',
    header: ({ table }) => h(Checkbox, {
      checked: table.getIsAllPageRowsSelected(),
      'onUpdate:checked': (value: boolean) => table.toggleAllPageRowsSelected(!!value),
    }),
    cell: ({ row }) => h(Checkbox, {
      checked: row.getIsSelected(),
      'onUpdate:checked': (value: boolean) => row.toggleSelected(!!value),
    }),
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
]

const sorting = ref<SortingState>([])
const table = useVueTable({
  data: data.value,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onSortingChange: updaterOrValue => {
    sorting.value = typeof updaterOrValue === 'function' 
      ? updaterOrValue(sorting.value) 
      : updaterOrValue
  },
  state: {
    get sorting() { return sorting.value }
  },
})
</script>

<template>
  <div class="w-full">
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() ? 'selected' : undefined"
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <TableRow>
              <TableCell :colspan="columns.length" class="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
```

### Chart Integration

```vue
<script setup lang="ts">
import { AreaChart } from '@/components/ui/chart-area'

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'hsl(var(--chart-1))',
  },
  mobile: {
    label: 'Mobile',
    color: 'hsl(var(--chart-2))',
  },
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Area Chart - Stacked</CardTitle>
      <CardDescription>
        Showing total visitors for the last 6 months
      </CardDescription>
    </CardHeader>
    <CardContent>
      <AreaChart
        :data="chartData"
        :categories="['desktop', 'mobile']"
        index="month"
        class="h-[250px]"
        :show-legend="true"
        :show-tooltip="true"
      />
    </CardContent>
  </Card>
</template>
```

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/shadcn-vue/`:

- Basic component usage patterns
- Advanced form implementations
- Data table configurations
- Chart integrations
- Theming examples
- Custom component creation
- Animation and transition patterns
- Accessibility implementations

## Schema and Type Definitions

Type definitions and validation schemas in `$HOME/.claude/snippets/shadcn-vue/schemas/`:

- `components.schema.json` - Configuration schema
- `registry-item.schema.json` - Custom component registry
- `types.d.ts` - TypeScript type definitions

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/shadcn-vue/linting/`:

- `biome.json` - Modern linting configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `.editorconfig` - Editor configuration

## CLI Reference

### Initialization

```bash
npx shadcn-vue@latest init [options]
# Options:
# -d, --defaults: Use default configuration
# -f, --force: Force overwrite existing files
# -y, --yes: Skip confirmation prompts
# -c, --cwd: Set working directory
```

### Adding Components

```bash
npx shadcn-vue@latest add [components...] [options]
# Examples:
npx shadcn-vue@latest add button
npx shadcn-vue@latest add button input form
npx shadcn-vue@latest add --all  # Add all components
```

### Component List

```bash
npx shadcn-vue@latest list
# Shows all available components
```

## Framework Integration

### Nuxt Module

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['shadcn-nuxt'],
  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  }
})
```

### Vite Configuration

```typescript
// vite.config.ts
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Astro Integration

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  integrations: [vue(), tailwind()],
})
```

## Best Practices

### Component Organization

- Place UI components in `src/components/ui/`
- Create feature-specific components in `src/components/features/`
- Use clear, descriptive component names
- Maintain consistent import patterns

### Styling Guidelines

- Use CSS variables for theming
- Leverage Tailwind utility classes
- Implement responsive design patterns
- Maintain consistent spacing and typography

### Accessibility Standards

- Include proper ARIA labels and descriptions
- Ensure keyboard navigation support
- Implement focus management
- Test with screen readers

### Performance Optimization

- Use component lazy loading for large applications
- Implement proper tree shaking
- Optimize bundle sizes with selective imports
- Use Vue's built-in performance features

## Migration Strategies

### From Other UI Libraries

1. **Component Mapping**: Map existing components to shadcn-vue equivalents
2. **Style Migration**: Convert existing styles to Tailwind classes
3. **Type Safety**: Add TypeScript types for better development experience
4. **Gradual Adoption**: Migrate components incrementally

### Version Updates

1. **Check Changelog**: Review breaking changes and new features
2. **Update Dependencies**: Update shadcn-vue and related packages
3. **Test Components**: Verify existing components work correctly
4. **Update Configurations**: Adjust configuration files as needed

## Troubleshooting

### Common Issues

- **TypeScript Errors**: Ensure proper path aliases in tsconfig.json
- **Style Conflicts**: Check Tailwind CSS configuration and imports
- **Component Not Found**: Verify component installation and imports
- **Build Errors**: Check for missing dependencies or configuration issues

### Debug Steps

1. Verify installation: `npx shadcn-vue@latest list`
2. Check configuration: Review `components.json`
3. Validate imports: Ensure correct component paths
4. Test in isolation: Create minimal reproduction cases

## See Also

- Complete reference: `@$HOME/.claude/references/shadcn-vue.md`
- Code examples: `@$HOME/.claude/snippets/shadcn-vue/`
- Schemas: `@$HOME/.claude/snippets/shadcn-vue/schemas/`
- Linting configs: `@$HOME/.claude/snippets/shadcn-vue/linting/`
