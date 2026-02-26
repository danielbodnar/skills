<template>
  <div class="composition-demo">
    <h2>Vue 3 Composition API Demo</h2>
    
    <!-- Reactive state -->
    <section class="section">
      <h3>Reactive State</h3>
      <p>Count: {{ count }}</p>
      <p>Double: {{ doubleCount }}</p>
      <button @click="increment">Increment</button>
      <button @click="decrement">Decrement</button>
      <button @click="reset">Reset</button>
    </section>

    <!-- User input -->
    <section class="section">
      <h3>User Input</h3>
      <input 
        v-model="username" 
        placeholder="Enter your name"
        @input="handleInput"
      />
      <p v-if="username">Hello, {{ username }}!</p>
      <p>Input length: {{ inputLength }}</p>
    </section>

    <!-- Todo list -->
    <section class="section">
      <h3>Todo List</h3>
      <div class="todo-input">
        <input 
          v-model="newTodo" 
          placeholder="Add a new todo"
          @keyup.enter="addTodo"
        />
        <button @click="addTodo">Add</button>
      </div>
      <ul class="todo-list">
        <li v-for="todo in todos" :key="todo.id" class="todo-item">
          <input 
            type="checkbox" 
            v-model="todo.completed"
          />
          <span :class="{ completed: todo.completed }">
            {{ todo.text }}
          </span>
          <button @click="removeTodo(todo.id)" class="remove-btn">
            Remove
          </button>
        </li>
      </ul>
      <p>Total todos: {{ todos.length }}, Completed: {{ completedCount }}</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// Basic reactive state
const count = ref(0)
const username = ref('')
const newTodo = ref('')

// Computed properties
const doubleCount = computed(() => count.value * 2)
const inputLength = computed(() => username.value.length)

// Todo list state
const todos = ref([
  { id: 1, text: 'Learn Vue 3', completed: false },
  { id: 2, text: 'Build an app', completed: false }
])

const completedCount = computed(() => 
  todos.value.filter(todo => todo.completed).length
)

// Methods
const increment = () => {
  count.value++
}

const decrement = () => {
  count.value--
}

const reset = () => {
  count.value = 0
}

const handleInput = (event) => {
  console.log('Input changed:', event.target.value)
}

const addTodo = () => {
  if (newTodo.value.trim()) {
    todos.value.push({
      id: Date.now(),
      text: newTodo.value.trim(),
      completed: false
    })
    newTodo.value = ''
  }
}

const removeTodo = (id) => {
  const index = todos.value.findIndex(todo => todo.id === id)
  if (index > -1) {
    todos.value.splice(index, 1)
  }
}

// Watchers
watch(count, (newCount, oldCount) => {
  console.log(`Count changed from ${oldCount} to ${newCount}`)
})

watch(username, (newUsername) => {
  console.log('Username changed to:', newUsername)
}, { immediate: true })

// Lifecycle hooks
onMounted(() => {
  console.log('Component mounted')
  document.title = 'Vue 3 Composition API Demo'
})

onUnmounted(() => {
  console.log('Component unmounted')
})
</script>

<style scoped>
.composition-demo {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

h2 {
  color: #42b883;
  text-align: center;
  margin-bottom: 2rem;
}

h3 {
  color: #333;
  margin-bottom: 1rem;
  border-bottom: 2px solid #42b883;
  padding-bottom: 0.5rem;
}

button {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  margin: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #369870;
}

input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin: 0.25rem;
}

.todo-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.todo-input input {
  flex: 1;
}

.todo-list {
  list-style: none;
  padding: 0;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  margin: 0.25rem 0;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.todo-item span.completed {
  text-decoration: line-through;
  color: #999;
}

.remove-btn {
  background-color: #e74c3c;
  margin-left: auto;
}

.remove-btn:hover {
  background-color: #c0392b;
}

p {
  margin: 0.5rem 0;
}
</style>