<!-- ParentComponent.vue -->
<template>
  <div class="parent-component">
    <h2>Parent-Child Communication Demo</h2>
    
    <!-- Props: Parent to Child -->
    <section class="section">
      <h3>Props: Parent → Child</h3>
      <div class="controls">
        <label>
          User Name:
          <input v-model="userData.name" type="text" />
        </label>
        <label>
          User Age:
          <input v-model.number="userData.age" type="number" />
        </label>
        <label>
          User Role:
          <select v-model="userData.role">
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
          </select>
        </label>
        <label>
          <input v-model="userData.isActive" type="checkbox" />
          Is Active
        </label>
      </div>
      
      <UserCard 
        :user="userData"
        :theme="currentTheme"
        @user-clicked="handleUserClick"
        @status-changed="handleStatusChange"
      />
    </section>

    <!-- Events: Child to Parent -->
    <section class="section">
      <h3>Events: Child → Parent</h3>
      <p><strong>Last clicked user:</strong> {{ lastClickedUser || 'None' }}</p>
      <p><strong>Status changes:</strong> {{ statusChanges }}</p>
      
      <div class="theme-controls">
        <button 
          v-for="theme in themes" 
          :key="theme"
          @click="currentTheme = theme"
          :class="{ active: currentTheme === theme }"
        >
          {{ theme }}
        </button>
      </div>
    </section>

    <!-- Slots: Content Distribution -->
    <section class="section">
      <h3>Slots: Content Distribution</h3>
      <Card title="User Profile">
        <template #header>
          <div class="card-header">
            <h4>Profile Information</h4>
            <span class="badge">{{ userData.role }}</span>
          </div>
        </template>
        
        <div class="profile-content">
          <p><strong>Name:</strong> {{ userData.name }}</p>
          <p><strong>Age:</strong> {{ userData.age }}</p>
          <p><strong>Status:</strong> {{ userData.isActive ? 'Active' : 'Inactive' }}</p>
        </div>
        
        <template #footer>
          <div class="card-footer">
            <button @click="editProfile">Edit Profile</button>
            <button @click="deleteProfile" class="danger">Delete</button>
          </div>
        </template>
      </Card>
    </section>

    <!-- v-model: Two-way Binding -->
    <section class="section">
      <h3>v-model: Two-way Binding</h3>
      <p><strong>Current search:</strong> "{{ searchQuery }}"</p>
      
      <SearchInput v-model="searchQuery" placeholder="Search users..." />
      
      <div v-if="searchQuery" class="search-results">
        <h4>Search Results for "{{ searchQuery }}":</h4>
        <ul>
          <li v-for="result in filteredUsers" :key="result.id">
            {{ result.name }} ({{ result.role }})
          </li>
        </ul>
      </div>
    </section>

    <!-- Provide/Inject -->
    <section class="section">
      <h3>Provide/Inject: Deep Nesting</h3>
      <p><strong>Current theme:</strong> {{ currentTheme }}</p>
      <p><strong>User preferences:</strong> {{ JSON.stringify(userPreferences) }}</p>
      
      <ThemeProvider>
        <NestedComponent />
      </ThemeProvider>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, provide } from 'vue'
import UserCard from './UserCard.vue'
import Card from './Card.vue'
import SearchInput from './SearchInput.vue'
import ThemeProvider from './ThemeProvider.vue'
import NestedComponent from './NestedComponent.vue'

// Reactive data
const userData = ref({
  name: 'John Doe',
  age: 30,
  role: 'user',
  isActive: true
})

const currentTheme = ref('light')
const themes = ['light', 'dark', 'colorful']
const lastClickedUser = ref('')
const statusChanges = ref(0)
const searchQuery = ref('')

// Sample users for search
const allUsers = ref([
  { id: 1, name: 'John Doe', role: 'user' },
  { id: 2, name: 'Jane Smith', role: 'admin' },
  { id: 3, name: 'Bob Johnson', role: 'moderator' },
  { id: 4, name: 'Alice Brown', role: 'user' },
  { id: 5, name: 'Charlie Wilson', role: 'admin' }
])

// User preferences for provide/inject
const userPreferences = ref({
  theme: currentTheme,
  notifications: true,
  language: 'en'
})

// Computed properties
const filteredUsers = computed(() => {
  if (!searchQuery.value) return []
  
  return allUsers.value.filter(user =>
    user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// Event handlers
const handleUserClick = (user) => {
  lastClickedUser.value = user.name
  console.log('User clicked:', user)
}

const handleStatusChange = (isActive) => {
  statusChanges.value++
  console.log('Status changed to:', isActive)
}

const editProfile = () => {
  alert('Edit profile functionality would go here')
}

const deleteProfile = () => {
  if (confirm('Are you sure you want to delete this profile?')) {
    alert('Profile deleted')
  }
}

// Provide data for deep nesting
provide('theme', currentTheme)
provide('userPreferences', userPreferences)
provide('updateTheme', (newTheme) => {
  currentTheme.value = newTheme
})
</script>

<!-- UserCard.vue - Child Component -->
<script>
// UserCard.vue
export default {
  name: 'UserCard',
  props: {
    user: {
      type: Object,
      required: true,
      validator(value) {
        return value && typeof value.name === 'string' && typeof value.age === 'number'
      }
    },
    theme: {
      type: String,
      default: 'light',
      validator(value) {
        return ['light', 'dark', 'colorful'].includes(value)
      }
    }
  },
  emits: ['user-clicked', 'status-changed'],
  computed: {
    cardClasses() {
      return [
        'user-card',
        `theme-${this.theme}`,
        { 'inactive': !this.user.isActive }
      ]
    },
    roleColor() {
      const colors = {
        admin: '#e74c3c',
        moderator: '#f39c12',
        user: '#3498db'
      }
      return colors[this.user.role] || '#95a5a6'
    }
  },
  methods: {
    handleClick() {
      this.$emit('user-clicked', this.user)
    },
    toggleStatus() {
      const newStatus = !this.user.isActive
      this.user.isActive = newStatus
      this.$emit('status-changed', newStatus)
    }
  }
}
</script>

<template>
  <div :class="cardClasses" @click="handleClick">
    <div class="user-header">
      <h4>{{ user.name }}</h4>
      <span 
        class="role-badge" 
        :style="{ backgroundColor: roleColor }"
      >
        {{ user.role }}
      </span>
    </div>
    <div class="user-body">
      <p><strong>Age:</strong> {{ user.age }}</p>
      <p>
        <strong>Status:</strong>
        <span :class="{ active: user.isActive, inactive: !user.isActive }">
          {{ user.isActive ? 'Active' : 'Inactive' }}
        </span>
      </p>
      <button @click.stop="toggleStatus" class="status-btn">
        {{ user.isActive ? 'Deactivate' : 'Activate' }}
      </button>
    </div>
  </div>
</template>

<!-- Card.vue - Slot Component -->
<script>
// Card.vue
export default {
  name: 'Card',
  props: {
    title: String
  }
}
</script>

<template>
  <div class="card">
    <header v-if="$slots.header" class="card-header">
      <slot name="header">
        <h3>{{ title }}</h3>
      </slot>
    </header>
    
    <main class="card-body">
      <slot></slot>
    </main>
    
    <footer v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </footer>
  </div>
</template>

<!-- SearchInput.vue - v-model Component -->
<script>
// SearchInput.vue
export default {
  name: 'SearchInput',
  props: {
    modelValue: String,
    placeholder: String
  },
  emits: ['update:modelValue'],
  computed: {
    value: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    }
  }
}
</script>

<template>
  <div class="search-input">
    <input 
      v-model="value"
      :placeholder="placeholder"
      type="text"
      class="search-field"
    />
    <button v-if="value" @click="value = ''" class="clear-btn">
      ×
    </button>
  </div>
</template>

<!-- ThemeProvider.vue - Provide/Inject Component -->
<script>
// ThemeProvider.vue
export default {
  name: 'ThemeProvider',
  inject: ['theme', 'userPreferences'],
  computed: {
    themeClasses() {
      return `theme-provider theme-${this.theme.value}`
    }
  }
}
</script>

<template>
  <div :class="themeClasses">
    <h4>Theme Provider</h4>
    <p>Current theme: {{ theme.value }}</p>
    <slot></slot>
  </div>
</template>

<!-- NestedComponent.vue - Deep Child Component -->
<script>
// NestedComponent.vue
export default {
  name: 'NestedComponent',
  inject: ['theme', 'userPreferences', 'updateTheme'],
  methods: {
    changeTheme(newTheme) {
      this.updateTheme(newTheme)
    }
  }
}
</script>

<template>
  <div class="nested-component">
    <h5>Deeply Nested Component</h5>
    <p>Injected theme: {{ theme.value }}</p>
    <p>Notifications enabled: {{ userPreferences.value.notifications }}</p>
    
    <div class="theme-buttons">
      <button @click="changeTheme('light')">Light</button>
      <button @click="changeTheme('dark')">Dark</button>
      <button @click="changeTheme('colorful')">Colorful</button>
    </div>
  </div>
</template>

<style scoped>
.parent-component {
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

.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.controls label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.controls input, .controls select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

/* User Card Styles */
.user-card {
  border: 2px solid #42b883;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.user-card.theme-dark {
  background: #2c3e50;
  color: white;
  border-color: #34495e;
}

.user-card.theme-colorful {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

.user-card.inactive {
  opacity: 0.6;
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.role-badge {
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.user-body .active {
  color: #27ae60;
  font-weight: bold;
}

.user-body .inactive {
  color: #e74c3c;
  font-weight: bold;
}

.status-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
}

/* Card Styles */
.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.card-header {
  background: #f8f9fa;
  padding: 1rem;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-body {
  padding: 1rem;
}

.card-footer {
  background: #f8f9fa;
  padding: 1rem;
  border-top: 1px solid #ddd;
  display: flex;
  gap: 0.5rem;
}

.badge {
  background: #42b883;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

.danger {
  background: #e74c3c !important;
}

/* Search Input Styles */
.search-input {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 400px;
}

.search-field {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #42b883;
  border-radius: 4px;
  font-size: 1rem;
}

.clear-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.search-results {
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.search-results ul {
  list-style: none;
  padding: 0;
}

.search-results li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

/* Theme Provider Styles */
.theme-provider {
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.theme-provider.theme-light {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
}

.theme-provider.theme-dark {
  background: #343a40;
  color: white;
  border: 1px solid #6c757d;
}

.theme-provider.theme-colorful {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  color: white;
}

.nested-component {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.theme-buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.theme-controls {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.theme-controls button {
  background: #f8f9fa;
  color: #333;
  border: 1px solid #dee2e6;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.theme-controls button.active {
  background: #42b883;
  color: white;
  border-color: #42b883;
}

button {
  background: #42b883;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;
}

button:hover {
  background: #369870;
}

@media (max-width: 768px) {
  .controls {
    grid-template-columns: 1fr;
  }
  
  .user-header {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  .card-footer {
    flex-direction: column;
  }
}
</style>