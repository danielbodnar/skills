<template>
  <div class="typed-component">
    <h2>TypeScript Vue Component Demo</h2>

    <!-- Props display -->
    <section class="section">
      <h3>Props</h3>
      <div class="props-display">
        <p><strong>User:</strong> {{ user.name }} ({{ user.email }})</p>
        <p><strong>Settings:</strong> {{ JSON.stringify(settings) }}</p>
        <p><strong>Items count:</strong> {{ items.length }}</p>
        <p><strong>Optional message:</strong> {{ optionalMessage || 'Not provided' }}</p>
      </div>
    </section>

    <!-- State management -->
    <section class="section">
      <h3>Reactive State</h3>
      <div class="state-controls">
        <p>Count: {{ count }}</p>
        <p>Status: {{ status }}</p>
        <p>Loading: {{ loading }}</p>
        
        <button @click="increment">Increment</button>
        <button @click="changeStatus">Change Status</button>
        <button @click="toggleLoading">Toggle Loading</button>
      </div>
    </section>

    <!-- Form handling -->
    <section class="section">
      <h3>Form with Validation</h3>
      <form @submit.prevent="handleSubmit" class="typed-form">
        <div class="form-group">
          <label for="email">Email:</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            :class="{ error: formErrors.email }"
            @blur="validateEmail"
          />
          <span v-if="formErrors.email" class="error-message">
            {{ formErrors.email }}
          </span>
        </div>

        <div class="form-group">
          <label for="role">Role:</label>
          <select id="role" v-model="formData.role">
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
          </select>
        </div>

        <div class="form-group">
          <label for="preferences">Preferences:</label>
          <div class="checkbox-group">
            <label>
              <input
                type="checkbox"
                v-model="formData.preferences.notifications"
              />
              Notifications
            </label>
            <label>
              <input
                type="checkbox"
                v-model="formData.preferences.newsletter"
              />
              Newsletter
            </label>
          </div>
        </div>

        <button type="submit" :disabled="!isFormValid">Submit</button>
      </form>
    </section>

    <!-- Event handling -->
    <section class="section">
      <h3>Events</h3>
      <div class="event-controls">
        <button @click="emitUserUpdate">Emit User Update</button>
        <button @click="emitCustomEvent">Emit Custom Event</button>
        <button @click="emitValidatedEvent">Emit Validated Event</button>
      </div>
      <p>Last event: {{ lastEvent }}</p>
    </section>

    <!-- Computed and watchers -->
    <section class="section">
      <h3>Computed & Watchers</h3>
      <div class="computed-display">
        <p>Computed full name: {{ computedFullName }}</p>
        <p>Is admin: {{ isAdmin }}</p>
        <p>Formatted settings: {{ formattedSettings }}</p>
      </div>
    </section>

    <!-- Generic component usage -->
    <section class="section">
      <h3>Generic Components</h3>
      <GenericList
        :items="stringItems"
        :render-item="renderStringItem"
        @item-selected="handleStringSelection"
      />
      
      <GenericList
        :items="numberItems"
        :render-item="renderNumberItem"
        @item-selected="handleNumberSelection"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import GenericList from './GenericList.vue'

// Define interfaces
interface User {
  id: number
  name: string
  email: string
  role: 'user' | 'admin' | 'moderator'
}

interface Settings {
  theme: 'light' | 'dark'
  language: string
  notifications: boolean
}

interface Item {
  id: number
  title: string
  description: string
}

interface FormData {
  email: string
  role: 'user' | 'admin' | 'moderator'
  preferences: {
    notifications: boolean
    newsletter: boolean
  }
}

interface FormErrors {
  email?: string
  role?: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

// Define props with TypeScript
interface Props {
  user: User
  settings: Settings
  items: Item[]
  optionalMessage?: string
}

const props = defineProps<Props>()

// Define emits with TypeScript
interface Emits {
  (e: 'user-updated', user: User): void
  (e: 'custom-event', data: { type: string; payload: unknown }): void
  (e: 'validated-event', value: string): void
}

const emit = defineEmits<Emits>()

// Reactive state with types
const count = ref<number>(0)
const status = ref<Status>('idle')
const loading = ref<boolean>(false)
const lastEvent = ref<string>('')

// Form data with typed reactive object
const formData = ref<FormData>({
  email: '',
  role: 'user',
  preferences: {
    notifications: true,
    newsletter: false
  }
})

const formErrors = ref<FormErrors>({})

// Generic data for demonstration
const stringItems = ref<string[]>(['Apple', 'Banana', 'Cherry'])
const numberItems = ref<number[]>([1, 2, 3, 4, 5])

// Computed properties with inferred types
const computedFullName = computed<string>(() => {
  return `${props.user.name} <${props.user.email}>`
})

const isAdmin = computed<boolean>(() => {
  return props.user.role === 'admin'
})

const formattedSettings = computed<string>(() => {
  return Object.entries(props.settings)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ')
})

const isFormValid = computed<boolean>(() => {
  return formData.value.email.length > 0 && 
         Object.keys(formErrors.value).length === 0
})

// Methods with explicit types
const increment = (): void => {
  count.value++
}

const changeStatus = (): void => {
  const statuses: Status[] = ['idle', 'loading', 'success', 'error']
  const currentIndex = statuses.indexOf(status.value)
  status.value = statuses[(currentIndex + 1) % statuses.length]
}

const toggleLoading = (): void => {
  loading.value = !loading.value
}

const validateEmail = (): void => {
  const email = formData.value.email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email) {
    formErrors.value.email = 'Email is required'
  } else if (!emailRegex.test(email)) {
    formErrors.value.email = 'Invalid email format'
  } else {
    delete formErrors.value.email
  }
}

const handleSubmit = (): void => {
  validateEmail()
  
  if (isFormValid.value) {
    console.log('Form submitted:', formData.value)
    lastEvent.value = `Form submitted with email: ${formData.value.email}`
  }
}

// Event emitting methods
const emitUserUpdate = (): void => {
  const updatedUser: User = {
    ...props.user,
    name: props.user.name + ' (Updated)'
  }
  emit('user-updated', updatedUser)
  lastEvent.value = 'User updated event emitted'
}

const emitCustomEvent = (): void => {
  emit('custom-event', {
    type: 'custom',
    payload: { timestamp: Date.now(), source: 'typed-component' }
  })
  lastEvent.value = 'Custom event emitted'
}

const emitValidatedEvent = (): void => {
  const value = 'validated-string'
  emit('validated-event', value)
  lastEvent.value = `Validated event emitted: ${value}`
}

// Generic component handlers
const renderStringItem = (item: string): string => {
  return `String: ${item}`
}

const renderNumberItem = (item: number): string => {
  return `Number: ${item} (squared: ${item * item})`
}

const handleStringSelection = (item: string): void => {
  console.log('Selected string:', item)
  lastEvent.value = `Selected string: ${item}`
}

const handleNumberSelection = (item: number): void => {
  console.log('Selected number:', item)
  lastEvent.value = `Selected number: ${item}`
}

// Watchers with types
watch(count, (newCount: number, oldCount: number) => {
  console.log(`Count changed from ${oldCount} to ${newCount}`)
})

watch(
  () => props.user,
  (newUser: User, oldUser: User) => {
    console.log('User prop changed:', { newUser, oldUser })
  },
  { deep: true }
)

watch(
  [status, loading],
  ([newStatus, newLoading]: [Status, boolean], [oldStatus, oldLoading]: [Status, boolean]) => {
    console.log(`Status: ${oldStatus} -> ${newStatus}, Loading: ${oldLoading} -> ${newLoading}`)
  }
)

// Lifecycle with types
onMounted((): void => {
  console.log('TypeScript component mounted')
  console.log('Props:', props)
})

// Async function with proper typing
const fetchUserData = async (userId: number): Promise<User> => {
  const response = await fetch(`/api/users/${userId}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`)
  }
  return response.json() as Promise<User>
}

// Helper function with generics
const createTypedArray = <T>(items: T[]): T[] => {
  return [...items]
}

// Example usage of the helper
const typedStringArray = createTypedArray<string>(['a', 'b', 'c'])
const typedNumberArray = createTypedArray<number>([1, 2, 3])

console.log({ typedStringArray, typedNumberArray })
</script>

<!-- GenericList.vue - Generic component example -->
<script setup lang="ts" generic="T">
interface Props {
  items: T[]
  renderItem: (item: T) => string
}

interface Emits {
  (e: 'item-selected', item: T): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectItem = (item: T): void => {
  emit('item-selected', item)
}
</script>

<template>
  <div class="generic-list">
    <h4>Generic List ({{ typeof items[0] }})</h4>
    <ul>
      <li
        v-for="item in items"
        :key="String(item)"
        @click="selectItem(item)"
        class="list-item"
      >
        {{ renderItem(item) }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.typed-component {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Segoe UI', sans-serif;
}

.section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

h2, h3 {
  color: #42b883;
  margin-bottom: 1rem;
}

.props-display,
.state-controls,
.computed-display {
  display: grid;
  gap: 0.5rem;
}

.event-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.typed-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.checkbox-group {
  display: flex;
  gap: 1rem;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

label {
  font-weight: bold;
  color: #333;
}

input, select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

input.error {
  border-color: #e74c3c;
  background-color: #fdf2f2;
}

.error-message {
  color: #e74c3c;
  font-size: 0.9rem;
}

button {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover:not(:disabled) {
  background-color: #369870;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.generic-list {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.generic-list h4 {
  margin: 0 0 0.5rem 0;
  color: #666;
}

.generic-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.list-item {
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.list-item:hover {
  background-color: #f0f0f0;
}

@media (max-width: 768px) {
  .event-controls {
    flex-direction: column;
  }
  
  .checkbox-group {
    flex-direction: column;
  }
}
</style>