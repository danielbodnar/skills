<template>
  <div class="hello-world">
    <h1>{{ greeting }}</h1>
    <p>{{ message }}</p>
    <button @click="updateMessage" class="btn">
      Click me!
    </button>
    <p class="counter">Clicked {{ count }} times</p>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'HelloWorld',
  setup() {
    const greeting = ref('Hello, Vue 3!')
    const message = ref('Welcome to your Vue.js app')
    const count = ref(0)

    const updateMessage = () => {
      count.value++
      message.value = `You've clicked the button ${count.value} time${count.value === 1 ? '' : 's'}!`
    }

    return {
      greeting,
      message,
      count,
      updateMessage
    }
  }
}
</script>

<style scoped>
.hello-world {
  text-align: center;
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  color: #42b883;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

p {
  font-size: 1.2rem;
  margin: 1rem 0;
  color: #333;
}

.btn {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn:hover {
  background-color: #369870;
}

.counter {
  font-weight: bold;
  color: #42b883;
}
</style>