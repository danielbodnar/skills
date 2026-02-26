<!-- shadcn-vue Forms and Validation Examples -->
<template>
  <div class="container mx-auto p-4 space-y-8">
    <!-- Basic Form -->
    <Card>
      <CardHeader>
        <CardTitle>Basic Contact Form</CardTitle>
        <CardDescription>
          A simple contact form with validation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleBasicSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="firstName">First name</Label>
              <Input
                id="firstName"
                v-model="basicForm.firstName"
                :class="{ 'border-red-500': basicErrors.firstName }"
                placeholder="Enter your first name"
              />
              <p v-if="basicErrors.firstName" class="text-sm text-red-500">
                {{ basicErrors.firstName }}
              </p>
            </div>
            <div class="space-y-2">
              <Label for="lastName">Last name</Label>
              <Input
                id="lastName"
                v-model="basicForm.lastName"
                :class="{ 'border-red-500': basicErrors.lastName }"
                placeholder="Enter your last name"
              />
              <p v-if="basicErrors.lastName" class="text-sm text-red-500">
                {{ basicErrors.lastName }}
              </p>
            </div>
          </div>
          
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              type="email"
              v-model="basicForm.email"
              :class="{ 'border-red-500': basicErrors.email }"
              placeholder="Enter your email"
            />
            <p v-if="basicErrors.email" class="text-sm text-red-500">
              {{ basicErrors.email }}
            </p>
          </div>
          
          <div class="space-y-2">
            <Label for="message">Message</Label>
            <Textarea
              id="message"
              v-model="basicForm.message"
              :class="{ 'border-red-500': basicErrors.message }"
              placeholder="Enter your message"
              class="min-h-[100px]"
            />
            <p v-if="basicErrors.message" class="text-sm text-red-500">
              {{ basicErrors.message }}
            </p>
          </div>
          
          <div class="flex items-center space-x-2">
            <Checkbox id="subscribe" v-model="basicForm.subscribe" />
            <Label for="subscribe">Subscribe to newsletter</Label>
          </div>
          
          <Button type="submit" :disabled="isSubmitting" class="w-full">
            {{ isSubmitting ? 'Sending...' : 'Send Message' }}
          </Button>
        </form>
      </CardContent>
    </Card>

    <!-- Advanced Form with Multiple Input Types -->
    <Card>
      <CardHeader>
        <CardTitle>User Profile Form</CardTitle>
        <CardDescription>
          Advanced form with various input types and validation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleAdvancedSubmit" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Personal Information -->
            <div class="space-y-4">
              <h3 class="text-lg font-medium">Personal Information</h3>
              
              <div class="space-y-2">
                <Label for="username">Username</Label>
                <Input
                  id="username"
                  v-model="advancedForm.username"
                  :class="{ 'border-red-500': advancedErrors.username }"
                  placeholder="Enter username"
                />
                <p v-if="advancedErrors.username" class="text-sm text-red-500">
                  {{ advancedErrors.username }}
                </p>
              </div>
              
              <div class="space-y-2">
                <Label for="birthday">Date of Birth</Label>
                <Popover v-model:open="calendarOpen">
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      :class="cn(
                        'w-full justify-start text-left font-normal',
                        !advancedForm.birthday && 'text-muted-foreground'
                      )"
                    >
                      <CalendarIcon class="mr-2 h-4 w-4" />
                      {{ advancedForm.birthday ? format(advancedForm.birthday, 'PPP') : 'Pick a date' }}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0">
                    <Calendar
                      v-model="advancedForm.birthday"
                      @update:model-value="calendarOpen = false"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div class="space-y-2">
                <Label for="country">Country</Label>
                <Select v-model="advancedForm.country">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="de">Germany</SelectItem>
                    <SelectItem value="fr">France</SelectItem>
                    <SelectItem value="jp">Japan</SelectItem>
                    <SelectItem value="au">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <!-- Preferences -->
            <div class="space-y-4">
              <h3 class="text-lg font-medium">Preferences</h3>
              
              <div class="space-y-2">
                <Label>Theme</Label>
                <RadioGroup v-model="advancedForm.theme" class="flex gap-6">
                  <div class="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label for="light">Light</Label>
                  </div>
                  <div class="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label for="dark">Dark</Label>
                  </div>
                  <div class="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label for="system">System</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div class="space-y-2">
                <Label>Notification Preferences</Label>
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <Label for="emailNotifications" class="text-sm font-normal">
                      Email notifications
                    </Label>
                    <Switch
                      id="emailNotifications"
                      v-model="advancedForm.emailNotifications"
                    />
                  </div>
                  <div class="flex items-center justify-between">
                    <Label for="pushNotifications" class="text-sm font-normal">
                      Push notifications
                    </Label>
                    <Switch
                      id="pushNotifications"
                      v-model="advancedForm.pushNotifications"
                    />
                  </div>
                  <div class="flex items-center justify-between">
                    <Label for="smsNotifications" class="text-sm font-normal">
                      SMS notifications
                    </Label>
                    <Switch
                      id="smsNotifications"
                      v-model="advancedForm.smsNotifications"
                    />
                  </div>
                </div>
              </div>
              
              <div class="space-y-2">
                <Label for="bio">Bio</Label>
                <Textarea
                  id="bio"
                  v-model="advancedForm.bio"
                  placeholder="Tell us about yourself"
                  class="min-h-[120px]"
                />
                <p class="text-xs text-muted-foreground">
                  {{ advancedForm.bio.length }}/500 characters
                </p>
              </div>
            </div>
          </div>
          
          <div class="space-y-4">
            <div class="space-y-2">
              <Label>Skills (Select multiple)</Label>
              <div class="flex flex-wrap gap-2">
                <Badge
                  v-for="skill in selectedSkills"
                  :key="skill"
                  variant="secondary"
                  class="cursor-pointer"
                  @click="removeSkill(skill)"
                >
                  {{ skill }}
                  <X class="ml-1 h-3 w-3" />
                </Badge>
              </div>
              <Popover v-model:open="skillsOpen">
                <PopoverTrigger as-child>
                  <Button variant="outline" class="w-full justify-start">
                    <Plus class="mr-2 h-4 w-4" />
                    Add skills
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="p-0">
                  <Command>
                    <CommandInput placeholder="Search skills..." />
                    <CommandEmpty>No skills found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        v-for="skill in availableSkills"
                        :key="skill"
                        @select="addSkill(skill)"
                      >
                        {{ skill }}
                      </CommandItem>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <Button type="submit" :disabled="isAdvancedSubmitting" class="w-full">
            {{ isAdvancedSubmitting ? 'Saving...' : 'Save Profile' }}
          </Button>
        </form>
      </CardContent>
    </Card>

    <!-- Form with File Upload -->
    <Card>
      <CardHeader>
        <CardTitle>Document Upload Form</CardTitle>
        <CardDescription>
          Form with file upload and progress tracking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleFileSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="documentTitle">Document Title</Label>
            <Input
              id="documentTitle"
              v-model="fileForm.title"
              placeholder="Enter document title"
            />
          </div>
          
          <div class="space-y-2">
            <Label>Document Category</Label>
            <Select v-model="fileForm.category">
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resume">Resume</SelectItem>
                <SelectItem value="cover-letter">Cover Letter</SelectItem>
                <SelectItem value="portfolio">Portfolio</SelectItem>
                <SelectItem value="certificate">Certificate</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div class="space-y-2">
            <Label for="file">Upload Document</Label>
            <div class="flex items-center justify-center w-full">
              <label
                for="file"
                class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
              >
                <div class="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                  <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span class="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    PDF, DOC, DOCX (MAX. 10MB)
                  </p>
                </div>
                <input
                  id="file"
                  type="file"
                  class="hidden"
                  accept=".pdf,.doc,.docx"
                  @change="handleFileChange"
                />
              </label>
            </div>
            <div v-if="selectedFile" class="text-sm text-gray-600">
              Selected: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
            </div>
          </div>
          
          <div v-if="uploadProgress > 0" class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>Upload Progress</span>
              <span>{{ uploadProgress }}%</span>
            </div>
            <Progress :value="uploadProgress" class="w-full" />
          </div>
          
          <Button type="submit" :disabled="!selectedFile || isFileSubmitting" class="w-full">
            {{ isFileSubmitting ? 'Uploading...' : 'Upload Document' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { CalendarIcon, Plus, X, Upload } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

// Component imports
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Progress } from '@/components/ui/progress'

// Basic form state
const basicForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  message: '',
  subscribe: false
})

const basicErrors = ref({})
const isSubmitting = ref(false)

// Advanced form state
const advancedForm = ref({
  username: '',
  birthday: null as Date | null,
  country: '',
  theme: 'system',
  emailNotifications: true,
  pushNotifications: false,
  smsNotifications: false,
  bio: ''
})

const advancedErrors = ref({})
const isAdvancedSubmitting = ref(false)
const calendarOpen = ref(false)

// Skills management
const selectedSkills = ref<string[]>([])
const skillsOpen = ref(false)
const availableSkills = [
  'JavaScript', 'TypeScript', 'Vue.js', 'React', 'Angular', 'Node.js',
  'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift',
  'HTML/CSS', 'Tailwind CSS', 'SASS', 'Bootstrap', 'Material UI',
  'Database Design', 'SQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
  'AWS', 'Azure', 'GCP', 'Git', 'CI/CD', 'Testing', 'Agile', 'Scrum'
]

const addSkill = (skill: string) => {
  if (!selectedSkills.value.includes(skill)) {
    selectedSkills.value.push(skill)
  }
  skillsOpen.value = false
}

const removeSkill = (skill: string) => {
  const index = selectedSkills.value.indexOf(skill)
  if (index > -1) {
    selectedSkills.value.splice(index, 1)
  }
}

// File form state
const fileForm = ref({
  title: '',
  category: ''
})

const selectedFile = ref<File | null>(null)
const uploadProgress = ref(0)
const isFileSubmitting = ref(false)

// Validation functions
const validateBasicForm = () => {
  const errors: any = {}
  
  if (!basicForm.value.firstName.trim()) {
    errors.firstName = 'First name is required'
  }
  
  if (!basicForm.value.lastName.trim()) {
    errors.lastName = 'Last name is required'
  }
  
  if (!basicForm.value.email.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(basicForm.value.email)) {
    errors.email = 'Invalid email format'
  }
  
  if (!basicForm.value.message.trim()) {
    errors.message = 'Message is required'
  } else if (basicForm.value.message.length < 10) {
    errors.message = 'Message must be at least 10 characters'
  }
  
  basicErrors.value = errors
  return Object.keys(errors).length === 0
}

const validateAdvancedForm = () => {
  const errors: any = {}
  
  if (!advancedForm.value.username.trim()) {
    errors.username = 'Username is required'
  } else if (advancedForm.value.username.length < 3) {
    errors.username = 'Username must be at least 3 characters'
  } else if (!/^[a-zA-Z0-9_]+$/.test(advancedForm.value.username)) {
    errors.username = 'Username can only contain letters, numbers, and underscores'
  }
  
  if (advancedForm.value.bio.length > 500) {
    errors.bio = 'Bio must be less than 500 characters'
  }
  
  advancedErrors.value = errors
  return Object.keys(errors).length === 0
}

// Form submission handlers
const handleBasicSubmit = async () => {
  if (!validateBasicForm()) return
  
  isSubmitting.value = true
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('Basic form submitted:', basicForm.value)
    
    // Reset form on success
    basicForm.value = {
      firstName: '',
      lastName: '',
      email: '',
      message: '',
      subscribe: false
    }
    basicErrors.value = {}
    
    // Show success message (in real app, use toast)
    alert('Message sent successfully!')
  } catch (error) {
    console.error('Form submission error:', error)
    alert('Failed to send message. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

const handleAdvancedSubmit = async () => {
  if (!validateAdvancedForm()) return
  
  isAdvancedSubmitting.value = true
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('Advanced form submitted:', {
      ...advancedForm.value,
      skills: selectedSkills.value
    })
    
    alert('Profile saved successfully!')
  } catch (error) {
    console.error('Form submission error:', error)
    alert('Failed to save profile. Please try again.')
  } finally {
    isAdvancedSubmitting.value = false
  }
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
  }
}

const handleFileSubmit = async () => {
  if (!selectedFile.value) return
  
  isFileSubmitting.value = true
  uploadProgress.value = 0
  
  try {
    // Simulate file upload with progress
    const uploadInterval = setInterval(() => {
      uploadProgress.value += 10
      if (uploadProgress.value >= 100) {
        clearInterval(uploadInterval)
      }
    }, 200)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('File form submitted:', {
      ...fileForm.value,
      file: selectedFile.value
    })
    
    // Reset form on success
    fileForm.value = {
      title: '',
      category: ''
    }
    selectedFile.value = null
    uploadProgress.value = 0
    
    alert('Document uploaded successfully!')
  } catch (error) {
    console.error('File upload error:', error)
    alert('Failed to upload document. Please try again.')
    uploadProgress.value = 0
  } finally {
    isFileSubmitting.value = false
  }
}

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>