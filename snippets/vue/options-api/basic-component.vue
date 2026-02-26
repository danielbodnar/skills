<template>
  <div class="options-demo">
    <h2>Vue Options API Demo</h2>
    
    <!-- User profile section -->
    <section class="section">
      <h3>User Profile</h3>
      <div class="profile">
        <img :src="user.avatar" :alt="user.name" class="avatar" />
        <div class="user-info">
          <h4>{{ user.name }}</h4>
          <p>{{ user.email }}</p>
          <p>{{ user.bio }}</p>
          <p><strong>Member since:</strong> {{ formattedJoinDate }}</p>
          <p><strong>Posts:</strong> {{ user.postCount }}</p>
        </div>
      </div>
    </section>

    <!-- Counter section -->
    <section class="section">
      <h3>Counter</h3>
      <p>Current count: {{ count }}</p>
      <p>Double count: {{ doubleCount }}</p>
      <p>Status: {{ countStatus }}</p>
      <div class="buttons">
        <button @click="increment">+1</button>
        <button @click="decrement">-1</button>
        <button @click="incrementBy(5)">+5</button>
        <button @click="resetCounter">Reset</button>
      </div>
    </section>

    <!-- Form section -->
    <section class="section">
      <h3>Contact Form</h3>
      <form @submit.prevent="submitForm" class="form">
        <div class="form-group">
          <label for="name">Name:</label>
          <input 
            id="name"
            v-model="form.name" 
            type="text" 
            required
            @blur="validateField('name')"
          />
          <span v-if="errors.name" class="error">{{ errors.name }}</span>
        </div>
        
        <div class="form-group">
          <label for="email">Email:</label>
          <input 
            id="email"
            v-model="form.email" 
            type="email" 
            required
            @blur="validateField('email')"
          />
          <span v-if="errors.email" class="error">{{ errors.email }}</span>
        </div>
        
        <div class="form-group">
          <label for="message">Message:</label>
          <textarea 
            id="message"
            v-model="form.message" 
            rows="4" 
            required
            @blur="validateField('message')"
          ></textarea>
          <span v-if="errors.message" class="error">{{ errors.message }}</span>
        </div>
        
        <button type="submit" :disabled="!isFormValid" class="submit-btn">
          {{ submitting ? 'Submitting...' : 'Submit' }}
        </button>
      </form>
      
      <div v-if="submitMessage" :class="['message', submitSuccess ? 'success' : 'error']">
        {{ submitMessage }}
      </div>
    </section>

    <!-- Todo list section -->
    <section class="section">
      <h3>Todo List</h3>
      <div class="todo-controls">
        <input 
          v-model="newTodo" 
          placeholder="Add a new todo..."
          @keyup.enter="addTodo"
          class="todo-input"
        />
        <button @click="addTodo" :disabled="!newTodo.trim()">Add</button>
      </div>
      
      <div class="todo-filters">
        <button 
          v-for="filter in filters" 
          :key="filter"
          @click="currentFilter = filter"
          :class="{ active: currentFilter === filter }"
          class="filter-btn"
        >
          {{ filter }}
        </button>
      </div>
      
      <ul class="todo-list">
        <li 
          v-for="todo in filteredTodos" 
          :key="todo.id" 
          class="todo-item"
          :class="{ completed: todo.completed }"
        >
          <input 
            type="checkbox" 
            v-model="todo.completed"
            @change="saveTodos"
          />
          <span class="todo-text">{{ todo.text }}</span>
          <button @click="removeTodo(todo.id)" class="remove-btn">×</button>
        </li>
      </ul>
      
      <div class="todo-stats">
        <p>Total: {{ todos.length }} | Completed: {{ completedTodos }} | Remaining: {{ remainingTodos }}</p>
        <button v-if="completedTodos > 0" @click="clearCompleted" class="clear-btn">
          Clear Completed
        </button>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'OptionsDemo',
  
  data() {
    return {
      // User data
      user: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        bio: 'Full-stack developer passionate about Vue.js',
        avatar: 'https://via.placeholder.com/80',
        joinDate: new Date('2020-01-15'),
        postCount: 42
      },
      
      // Counter
      count: 0,
      
      // Form data
      form: {
        name: '',
        email: '',
        message: ''
      },
      errors: {},
      submitting: false,
      submitMessage: '',
      submitSuccess: false,
      
      // Todo list
      newTodo: '',
      todos: [
        { id: 1, text: 'Learn Vue.js Options API', completed: false },
        { id: 2, text: 'Build a todo app', completed: true },
        { id: 3, text: 'Deploy to production', completed: false }
      ],
      currentFilter: 'All',
      filters: ['All', 'Active', 'Completed']
    }
  },
  
  computed: {
    doubleCount() {
      return this.count * 2
    },
    
    countStatus() {
      if (this.count === 0) return 'Zero'
      if (this.count > 0) return 'Positive'
      return 'Negative'
    },
    
    formattedJoinDate() {
      return this.user.joinDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },
    
    isFormValid() {
      return this.form.name.trim() && 
             this.form.email.trim() && 
             this.form.message.trim() &&
             Object.keys(this.errors).length === 0
    },
    
    filteredTodos() {
      switch (this.currentFilter) {
        case 'Active':
          return this.todos.filter(todo => !todo.completed)
        case 'Completed':
          return this.todos.filter(todo => todo.completed)
        default:
          return this.todos
      }
    },
    
    completedTodos() {
      return this.todos.filter(todo => todo.completed).length
    },
    
    remainingTodos() {
      return this.todos.length - this.completedTodos
    }
  },
  
  methods: {
    // Counter methods
    increment() {
      this.count++
    },
    
    decrement() {
      this.count--
    },
    
    incrementBy(amount) {
      this.count += amount
    },
    
    resetCounter() {
      this.count = 0
    },
    
    // Form methods
    validateField(field) {
      const value = this.form[field]
      
      switch (field) {
        case 'name':
          if (!value.trim()) {
            this.$set(this.errors, 'name', 'Name is required')
          } else if (value.length < 2) {
            this.$set(this.errors, 'name', 'Name must be at least 2 characters')
          } else {
            this.$delete(this.errors, 'name')
          }
          break
          
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!value.trim()) {
            this.$set(this.errors, 'email', 'Email is required')
          } else if (!emailRegex.test(value)) {
            this.$set(this.errors, 'email', 'Please enter a valid email')
          } else {
            this.$delete(this.errors, 'email')
          }
          break
          
        case 'message':
          if (!value.trim()) {
            this.$set(this.errors, 'message', 'Message is required')
          } else if (value.length < 10) {
            this.$set(this.errors, 'message', 'Message must be at least 10 characters')
          } else {
            this.$delete(this.errors, 'message')
          }
          break
      }
    },
    
    async submitForm() {
      // Validate all fields
      Object.keys(this.form).forEach(field => this.validateField(field))
      
      if (!this.isFormValid) return
      
      this.submitting = true
      this.submitMessage = ''
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Simulate random success/failure
        if (Math.random() > 0.3) {
          this.submitSuccess = true
          this.submitMessage = 'Form submitted successfully!'
          
          // Reset form
          this.form = { name: '', email: '', message: '' }
          this.errors = {}
        } else {
          throw new Error('Server error occurred')
        }
      } catch (error) {
        this.submitSuccess = false
        this.submitMessage = 'Failed to submit form. Please try again.'
      } finally {
        this.submitting = false
        
        // Clear message after 5 seconds
        setTimeout(() => {
          this.submitMessage = ''
        }, 5000)
      }
    },
    
    // Todo methods
    addTodo() {
      if (this.newTodo.trim()) {
        this.todos.push({
          id: Date.now(),
          text: this.newTodo.trim(),
          completed: false
        })
        this.newTodo = ''
        this.saveTodos()
      }
    },
    
    removeTodo(id) {
      const index = this.todos.findIndex(todo => todo.id === id)
      if (index > -1) {
        this.todos.splice(index, 1)
        this.saveTodos()
      }
    },
    
    clearCompleted() {
      this.todos = this.todos.filter(todo => !todo.completed)
      this.saveTodos()
    },
    
    saveTodos() {
      localStorage.setItem('vue-todos', JSON.stringify(this.todos))
    },
    
    loadTodos() {
      const saved = localStorage.getItem('vue-todos')
      if (saved) {
        this.todos = JSON.parse(saved)
      }
    }
  },
  
  watch: {
    count(newVal, oldVal) {
      console.log(`Count changed from ${oldVal} to ${newVal}`)
    },
    
    'form.email': {
      handler(newEmail) {
        // Auto-validate email on change
        if (newEmail) {
          this.validateField('email')
        }
      },
      immediate: true
    }
  },
  
  created() {
    console.log('Component created')
    this.loadTodos()
  },
  
  mounted() {
    console.log('Component mounted')
    document.title = 'Vue Options API Demo'
  },
  
  beforeUnmount() {
    console.log('Component will unmount')
  }
}
</script>

<style scoped>
.options-demo {
  max-width: 1000px;
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

/* Profile styles */
.profile {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info h4 {
  margin: 0 0 0.5rem 0;
  color: #42b883;
}

.user-info p {
  margin: 0.25rem 0;
}

/* Button styles */
.buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
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

/* Form styles */
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  font-weight: bold;
  margin-bottom: 0.25rem;
  color: #333;
}

input, textarea {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

input:focus, textarea:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.2);
}

.error {
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.submit-btn {
  align-self: flex-start;
  background-color: #42b883;
}

.message {
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Todo styles */
.todo-controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.todo-input {
  flex: 1;
}

.todo-filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.filter-btn {
  background-color: #f8f9fa;
  color: #333;
  border: 1px solid #dee2e6;
}

.filter-btn.active {
  background-color: #42b883;
  color: white;
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  margin: 0.25rem 0;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.todo-item:hover {
  background-color: #f8f9fa;
}

.todo-item.completed {
  opacity: 0.7;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: #6c757d;
}

.todo-text {
  flex: 1;
}

.remove-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0;
}

.todo-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.clear-btn {
  background-color: #6c757d;
}

@media (max-width: 768px) {
  .profile {
    flex-direction: column;
    text-align: center;
  }
  
  .todo-controls {
    flex-direction: column;
  }
  
  .todo-stats {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
}
</style>