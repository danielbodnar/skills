// useCounter.js - Basic counter composable
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  
  const increment = () => count.value++
  const decrement = () => count.value--
  const reset = () => count.value = initialValue
  
  const isPositive = computed(() => count.value > 0)
  const isNegative = computed(() => count.value < 0)
  const absolute = computed(() => Math.abs(count.value))
  
  return {
    count,
    increment,
    decrement,
    reset,
    isPositive,
    isNegative,
    absolute
  }
}

// useFetch.js - Data fetching composable
import { ref, computed } from 'vue'

export function useFetch(url) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)
  
  const execute = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(url.value || url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      data.value = await response.json()
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }
  
  const refetch = () => execute()
  
  const hasData = computed(() => data.value !== null)
  const hasError = computed(() => error.value !== null)
  
  // Auto-execute on creation
  execute()
  
  return {
    data,
    error,
    loading,
    execute,
    refetch,
    hasData,
    hasError
  }
}

// useLocalStorage.js - Local storage composable
import { ref, watch } from 'vue'

export function useLocalStorage(key, defaultValue = null) {
  const storedValue = localStorage.getItem(key)
  const initial = storedValue ? JSON.parse(storedValue) : defaultValue
  
  const value = ref(initial)
  
  // Watch for changes and update localStorage
  watch(value, (newValue) => {
    if (newValue === null || newValue === undefined) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, JSON.stringify(newValue))
    }
  }, { deep: true })
  
  const remove = () => {
    value.value = null
  }
  
  const clear = () => {
    localStorage.clear()
  }
  
  return {
    value,
    remove,
    clear
  }
}

// useDebounce.js - Debouncing composable
import { ref, watch } from 'vue'

export function useDebounce(initialValue, delay = 300) {
  const value = ref(initialValue)
  const debouncedValue = ref(initialValue)
  
  let timeout = null
  
  watch(value, (newValue) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })
  
  return {
    value,
    debouncedValue
  }
}

// useEventListener.js - Event listener composable
import { onMounted, onUnmounted } from 'vue'

export function useEventListener(target, event, callback, options = {}) {
  onMounted(() => {
    const element = target.value || target || window
    element.addEventListener(event, callback, options)
  })
  
  onUnmounted(() => {
    const element = target.value || target || window
    element.removeEventListener(event, callback, options)
  })
}

// useWindowSize.js - Window size tracking composable
import { ref, onMounted, onUnmounted } from 'vue'

export function useWindowSize() {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)
  
  const update = () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }
  
  onMounted(() => {
    window.addEventListener('resize', update)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })
  
  return {
    width,
    height
  }
}

// useToggle.js - Toggle state composable
import { ref } from 'vue'

export function useToggle(initialValue = false) {
  const state = ref(initialValue)
  
  const toggle = () => {
    state.value = !state.value
  }
  
  const setTrue = () => {
    state.value = true
  }
  
  const setFalse = () => {
    state.value = false
  }
  
  return {
    state,
    toggle,
    setTrue,
    setFalse
  }
}

// useAsync.js - Async operation composable
import { ref, computed } from 'vue'

export function useAsync(asyncFunction) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)
  
  const execute = async (...args) => {
    loading.value = true
    error.value = null
    
    try {
      data.value = await asyncFunction(...args)
      return data.value
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const reset = () => {
    data.value = null
    error.value = null
    loading.value = false
  }
  
  const isReady = computed(() => !loading.value && !error.value)
  const hasError = computed(() => error.value !== null)
  
  return {
    data,
    error,
    loading,
    execute,
    reset,
    isReady,
    hasError
  }
}

// useForm.js - Form validation composable
import { ref, reactive, computed } from 'vue'

export function useForm(initialValues = {}, validationRules = {}) {
  const values = reactive({ ...initialValues })
  const errors = ref({})
  const touched = ref({})
  
  const validate = (field = null) => {
    const fieldsToValidate = field ? [field] : Object.keys(validationRules)
    
    fieldsToValidate.forEach(fieldName => {
      const rules = validationRules[fieldName]
      const value = values[fieldName]
      
      if (rules) {
        const fieldErrors = []
        
        if (rules.required && (!value || value.toString().trim() === '')) {
          fieldErrors.push('This field is required')
        }
        
        if (rules.minLength && value && value.length < rules.minLength) {
          fieldErrors.push(`Must be at least ${rules.minLength} characters`)
        }
        
        if (rules.pattern && value && !rules.pattern.test(value)) {
          fieldErrors.push(rules.message || 'Invalid format')
        }
        
        if (rules.custom && value) {
          const customError = rules.custom(value)
          if (customError) {
            fieldErrors.push(customError)
          }
        }
        
        errors.value[fieldName] = fieldErrors
      }
    })
  }
  
  const setFieldValue = (field, value) => {
    values[field] = value
    touched.value[field] = true
    validate(field)
  }
  
  const reset = () => {
    Object.keys(values).forEach(key => {
      values[key] = initialValues[key] || ''
    })
    errors.value = {}
    touched.value = {}
  }
  
  const isValid = computed(() => {
    return Object.values(errors.value).every(fieldErrors => 
      !fieldErrors || fieldErrors.length === 0
    )
  })
  
  const hasErrors = computed(() => !isValid.value)
  
  return {
    values,
    errors,
    touched,
    validate,
    setFieldValue,
    reset,
    isValid,
    hasErrors
  }
}