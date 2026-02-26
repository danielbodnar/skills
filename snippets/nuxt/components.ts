// Nuxt 4 component development patterns and examples

// 1. Basic Vue component with TypeScript (components/AppButton.vue)
/*
<template>
  <button 
    :class="[
      'px-4 py-2 rounded-lg font-medium transition-colors',
      variantClasses,
      sizeClasses,
      { 'opacity-50 cursor-not-allowed': disabled }
    ]"
    :disabled="disabled"
    @click="handleClick"
  >
    <Icon v-if="icon" :name="icon" class="mr-2" />
    <slot />
    <Icon v-if="loading" name="loader" class="ml-2 animate-spin" />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  loading?: boolean
  disabled?: boolean
}

interface Emits {
  click: [event: MouseEvent]
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false
})

const emit = defineEmits<Emits>()

const variantClasses = computed(() => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  }
  return variants[props.variant]
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'text-sm px-3 py-1',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3'
  }
  return sizes[props.size]
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>
*/

// 2. Data fetching component (components/UserList.vue)
/*
<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold">Users</h2>
      <AppButton @click="refresh" :loading="pending">Refresh</AppButton>
    </div>
    
    <div v-if="error" class="bg-red-100 text-red-700 p-4 rounded">
      Error loading users: {{ error.message }}
    </div>
    
    <div v-else-if="pending" class="grid gap-4">
      <UserSkeleton v-for="i in 5" :key="i" />
    </div>
    
    <div v-else class="grid gap-4">
      <UserCard 
        v-for="user in data?.users" 
        :key="user.id" 
        :user="user"
        @update="refresh" 
      />
    </div>
    
    <Pagination 
      v-if="data?.pagination" 
      :pagination="data.pagination"
      @page-change="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts">
interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

const page = ref(1)
const limit = ref(10)

const { data, pending, error, refresh } = await useFetch<UsersResponse>('/api/users', {
  query: { page, limit },
  key: 'users'
})

const handlePageChange = (newPage: number) => {
  page.value = newPage
}

// SEO and meta
useHead({
  title: 'Users - Admin Dashboard',
  meta: [
    { name: 'description', content: 'Manage users in the admin dashboard' }
  ]
})
</script>
*/

// 3. Form component with validation (components/ContactForm.vue)
/*
<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700">
        Name *
      </label>
      <input
        id="name"
        v-model="form.name"
        type="text"
        required
        :class="[
          'mt-1 block w-full rounded-md border px-3 py-2',
          errors.name ? 'border-red-500' : 'border-gray-300'
        ]"
        @blur="validateField('name')"
      />
      <p v-if="errors.name" class="mt-1 text-sm text-red-600">
        {{ errors.name }}
      </p>
    </div>
    
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700">
        Email *
      </label>
      <input
        id="email"
        v-model="form.email"
        type="email"
        required
        :class="[
          'mt-1 block w-full rounded-md border px-3 py-2',
          errors.email ? 'border-red-500' : 'border-gray-300'
        ]"
        @blur="validateField('email')"
      />
      <p v-if="errors.email" class="mt-1 text-sm text-red-600">
        {{ errors.email }}
      </p>
    </div>
    
    <div>
      <label for="message" class="block text-sm font-medium text-gray-700">
        Message *
      </label>
      <textarea
        id="message"
        v-model="form.message"
        rows="4"
        required
        :class="[
          'mt-1 block w-full rounded-md border px-3 py-2',
          errors.message ? 'border-red-500' : 'border-gray-300'
        ]"
        @blur="validateField('message')"
      />
      <p v-if="errors.message" class="mt-1 text-sm text-red-600">
        {{ errors.message }}
      </p>
    </div>
    
    <AppButton 
      type="submit" 
      :loading="pending"
      :disabled="!isFormValid"
      class="w-full"
    >
      Send Message
    </AppButton>
    
    <div v-if="success" class="bg-green-100 text-green-700 p-4 rounded">
      Message sent successfully!
    </div>
  </form>
</template>

<script setup lang="ts">
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  message: z.string().min(10, 'Message must be at least 10 characters')
})

const form = reactive({
  name: '',
  email: '',
  message: ''
})

const errors = reactive({
  name: '',
  email: '',
  message: ''
})

const pending = ref(false)
const success = ref(false)

const isFormValid = computed(() => {
  return !Object.values(errors).some(error => error) &&
         Object.values(form).every(value => value.trim())
})

const validateField = (field: keyof typeof form) => {
  try {
    schema.pick({ [field]: true }).parse({ [field]: form[field] })
    errors[field] = ''
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors[field] = error.errors[0].message
    }
  }
}

const handleSubmit = async () => {
  // Validate all fields
  Object.keys(form).forEach(field => validateField(field as keyof typeof form))
  
  if (!isFormValid.value) return
  
  pending.value = true
  success.value = false
  
  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: form
    })
    
    success.value = true
    Object.assign(form, { name: '', email: '', message: '' })
  } catch (error) {
    console.error('Failed to send message:', error)
  } finally {
    pending.value = false
  }
}
</script>
*/

// 4. Server component (components/ServerStats.server.vue)
/*
<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-medium text-gray-900 mb-4">Server Statistics</h3>
    
    <div class="grid grid-cols-2 gap-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-600">{{ stats.activeUsers }}</div>
        <div class="text-sm text-gray-500">Active Users</div>
      </div>
      
      <div class="text-center">
        <div class="text-2xl font-bold text-green-600">{{ stats.totalOrders }}</div>
        <div class="text-sm text-gray-500">Total Orders</div>
      </div>
    </div>
    
    <div class="mt-4 text-xs text-gray-400">
      Last updated: {{ new Date().toLocaleString() }}
    </div>
  </div>
</template>

<script setup lang="ts">
// This runs only on the server
const stats = await $fetch('/api/stats')
</script>
*/

// 5. Client-only component (components/ClientChart.client.vue)
/*
<template>
  <div class="w-full h-64">
    <canvas ref="chartRef" />
  </div>
</template>

<script setup lang="ts">
import Chart from 'chart.js/auto'

interface Props {
  data: number[]
  labels: string[]
}

const props = defineProps<Props>()
const chartRef = ref<HTMLCanvasElement>()
let chartInstance: Chart

onMounted(() => {
  if (chartRef.value) {
    chartInstance = new Chart(chartRef.value, {
      type: 'line',
      data: {
        labels: props.labels,
        datasets: [{
          label: 'Values',
          data: props.data,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    })
  }
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})

watch(() => props.data, (newData) => {
  if (chartInstance) {
    chartInstance.data.datasets[0].data = newData
    chartInstance.update()
  }
})
</script>
*/

// 6. Island component (components/InteractiveWidget.island.vue)
/*
<template>
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <h4 class="font-medium text-blue-900 mb-2">Interactive Counter</h4>
    
    <div class="flex items-center space-x-4">
      <button 
        @click="decrement"
        class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
      >
        -
      </button>
      
      <span class="text-xl font-bold text-blue-800">{{ count }}</span>
      
      <button 
        @click="increment"
        class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
      >
        +
      </button>
    </div>
    
    <p class="text-sm text-blue-600 mt-2">
      This widget is interactive even when JavaScript is disabled on the main page.
    </p>
  </div>
</template>

<script setup lang="ts">
const count = ref(0)

const increment = () => count.value++
const decrement = () => count.value--
</script>
*/

// 7. Composable-based component (components/TodoList.vue)
/*
<template>
  <div class="space-y-4">
    <form @submit.prevent="addTodo" class="flex space-x-2">
      <input
        v-model="newTodo"
        type="text"
        placeholder="Add a new todo..."
        class="flex-1 px-3 py-2 border border-gray-300 rounded-md"
      />
      <AppButton type="submit" :disabled="!newTodo.trim()">
        Add
      </AppButton>
    </form>
    
    <div class="space-y-2">
      <div
        v-for="todo in todos"
        :key="todo.id"
        class="flex items-center space-x-3 p-3 bg-gray-50 rounded-md"
      >
        <input
          :checked="todo.completed"
          type="checkbox"
          @change="toggleTodo(todo.id)"
          class="h-4 w-4 text-blue-600"
        />
        
        <span 
          :class="{ 'line-through text-gray-500': todo.completed }"
          class="flex-1"
        >
          {{ todo.text }}
        </span>
        
        <button
          @click="removeTodo(todo.id)"
          class="text-red-600 hover:text-red-800"
        >
          Remove
        </button>
      </div>
    </div>
    
    <div v-if="todos.length === 0" class="text-center text-gray-500 py-8">
      No todos yet. Add one above!
    </div>
  </div>
</template>

<script setup lang="ts">
// Using a custom composable
const { todos, addTodo: add, removeTodo, toggleTodo } = useTodos()

const newTodo = ref('')

const addTodo = () => {
  if (newTodo.value.trim()) {
    add(newTodo.value.trim())
    newTodo.value = ''
  }
}
</script>
*/

// 8. Dynamic component with async loading (components/DynamicContent.vue)
/*
<template>
  <div>
    <select v-model="selectedComponent" class="mb-4 p-2 border rounded">
      <option value="">Select a component</option>
      <option value="Chart">Chart</option>
      <option value="Table">Table</option>
      <option value="Form">Form</option>
    </select>
    
    <Suspense>
      <component 
        :is="dynamicComponent" 
        v-if="selectedComponent"
        :data="componentData"
      />
      
      <template #fallback>
        <div class="animate-pulse bg-gray-200 h-32 rounded"></div>
      </template>
    </Suspense>
  </div>
</template>

<script setup lang="ts">
const selectedComponent = ref('')

const componentMap = {
  Chart: () => import('./ClientChart.client.vue'),
  Table: () => import('./DataTable.vue'),
  Form: () => import('./ContactForm.vue')
}

const dynamicComponent = computed(() => {
  return selectedComponent.value ? componentMap[selectedComponent.value as keyof typeof componentMap] : null
})

const componentData = computed(() => {
  // Return different data based on selected component
  if (selectedComponent.value === 'Chart') {
    return {
      data: [1, 2, 3, 4, 5],
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May']
    }
  }
  return {}
})
</script>
*/

// 9. Teleport component for modals (components/Modal.vue)
/*
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div 
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="close"
      >
        <div class="fixed inset-0 bg-black bg-opacity-50"></div>
        
        <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div class="flex justify-between items-center p-6 border-b">
            <h3 class="text-lg font-medium">{{ title }}</h3>
            <button @click="close" class="text-gray-400 hover:text-gray-600">
              <Icon name="x" />
            </button>
          </div>
          
          <div class="p-6">
            <slot />
          </div>
          
          <div v-if="$slots.footer" class="px-6 py-4 border-t bg-gray-50">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
}

interface Emits {
  'update:modelValue': [value: boolean]
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const close = () => {
  emit('update:modelValue', false)
}

// Close on escape key
useEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    close()
  }
})
</script>

<style scoped>
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
</style>
*/

// 10. Infinite scroll component (components/InfiniteList.vue)
/*
<template>
  <div class="space-y-4">
    <div
      v-for="item in items"
      :key="item.id"
      class="p-4 bg-white border rounded-lg shadow-sm"
    >
      <slot :item="item" />
    </div>
    
    <div 
      ref="loadMoreTrigger"
      class="h-10 flex items-center justify-center"
    >
      <div v-if="loading" class="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      <p v-else-if="hasMore" class="text-gray-500">Scroll to load more...</p>
      <p v-else class="text-gray-500">No more items</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  fetchFn: (page: number) => Promise<{ items: any[], hasMore: boolean }>
}

const props = defineProps<Props>()

const items = ref([])
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const loadMoreTrigger = ref<HTMLElement>()

const loadMore = async () => {
  if (loading.value || !hasMore.value) return
  
  loading.value = true
  
  try {
    const result = await props.fetchFn(page.value)
    items.value.push(...result.items)
    hasMore.value = result.hasMore
    page.value++
  } catch (error) {
    console.error('Failed to load more items:', error)
  } finally {
    loading.value = false
  }
}

// Initial load
onMounted(loadMore)

// Intersection observer for infinite scroll
useIntersectionObserver(loadMoreTrigger, ([{ isIntersecting }]) => {
  if (isIntersecting) {
    loadMore()
  }
})
</script>
*/