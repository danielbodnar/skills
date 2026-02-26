<!-- Advanced shadcn-vue API Usage Examples -->
<template>
  <div class="container mx-auto p-4 space-y-12">
    <!-- Combobox with Search -->
    <section class="space-y-4">
      <h2 class="text-2xl font-bold">Combobox with Search</h2>
      <Popover v-model:open="comboboxOpen">
        <PopoverTrigger as-child>
          <Button
            variant="outline"
            role="combobox"
            :aria-expanded="comboboxOpen"
            class="w-[300px] justify-between"
          >
            {{ 
              selectedFramework 
                ? frameworks.find(f => f.value === selectedFramework)?.label 
                : 'Select framework...' 
            }}
            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-[300px] p-0">
          <Command v-model="selectedFramework">
            <CommandInput placeholder="Search framework..." />
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandList>
              <CommandGroup>
                <CommandItem
                  v-for="framework in frameworks"
                  :key="framework.value"
                  :value="framework.value"
                  @select="comboboxOpen = false"
                >
                  <Check
                    :class="cn(
                      'mr-2 h-4 w-4',
                      selectedFramework === framework.value ? 'opacity-100' : 'opacity-0',
                    )"
                  />
                  {{ framework.label }}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </section>

    <!-- Select Component -->
    <section class="space-y-4">
      <h2 class="text-2xl font-bold">Select Components</h2>
      <div class="grid md:grid-cols-2 gap-4 max-w-2xl">
        <div class="space-y-2">
          <Label>Select Theme</Label>
          <Select v-model="selectedTheme">
            <SelectTrigger>
              <SelectValue placeholder="Select a theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Themes</SelectLabel>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        <div class="space-y-2">
          <Label>Select Font</Label>
          <Select v-model="selectedFont">
            <SelectTrigger>
              <SelectValue placeholder="Select a font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inter">Inter</SelectItem>
              <SelectItem value="roboto">Roboto</SelectItem>
              <SelectItem value="open-sans">Open Sans</SelectItem>
              <SelectItem value="lato">Lato</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>

    <!-- Toggle Group -->
    <section class="space-y-4">
      <h2 class="text-2xl font-bold">Toggle Groups</h2>
      <div class="space-y-4">
        <div class="space-y-2">
          <Label>Text Alignment (Single)</Label>
          <ToggleGroup v-model="textAlign" type="single">
            <ToggleGroupItem value="left">
              <AlignLeft class="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center">
              <AlignCenter class="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right">
              <AlignRight class="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <div class="space-y-2">
          <Label>Text Formatting (Multiple)</Label>
          <ToggleGroup v-model="textFormats" type="multiple">
            <ToggleGroupItem value="bold">
              <Bold class="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic">
              <Italic class="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline">
              <Underline class="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="strikethrough">
              <Strikethrough class="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </section>

    <!-- Collapsible Content -->
    <section class="space-y-4">
      <h2 class="text-2xl font-bold">Collapsible Content</h2>
      <Collapsible v-model:open="collapsibleOpen" class="w-[350px] space-y-2">
        <div class="flex items-center justify-between space-x-4 px-4">
          <h4 class="text-sm font-semibold">
            @peduarte starred 3 repositories
          </h4>
          <CollapsibleTrigger as-child>
            <Button variant="ghost" size="sm" class="w-9 p-0">
              <ChevronsUpDown class="h-4 w-4" />
              <span class="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <div class="rounded-md border px-4 py-3 font-mono text-sm">
          @radix-ui/primitives
        </div>
        <CollapsibleContent class="space-y-2">
          <div class="rounded-md border px-4 py-3 font-mono text-sm">
            @radix-ui/colors
          </div>
          <div class="rounded-md border px-4 py-3 font-mono text-sm">
            @stitches/react
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>

    <!-- Progress Indicators -->
    <section class="space-y-4">
      <h2 class="text-2xl font-bold">Progress Indicators</h2>
      <div class="space-y-4 max-w-md">
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span>Upload Progress</span>
            <span>{{ progressValue }}%</span>
          </div>
          <Progress :value="progressValue" class="w-full" />
          <div class="flex gap-2">
            <Button @click="decreaseProgress" size="sm" variant="outline">
              Decrease
            </Button>
            <Button @click="increaseProgress" size="sm">
              Increase
            </Button>
          </div>
        </div>
        
        <div class="space-y-2">
          <Label>Volume</Label>
          <Slider
            v-model="volumeValue"
            :max="100"
            :step="1"
            class="w-full"
          />
          <div class="text-center text-sm text-muted-foreground">
            {{ volumeValue[0] }}%
          </div>
        </div>
      </div>
    </section>

    <!-- Date and Time Pickers -->
    <section class="space-y-4">
      <h2 class="text-2xl font-bold">Date & Time Pickers</h2>
      <div class="grid md:grid-cols-2 gap-6 max-w-2xl">
        <div class="space-y-2">
          <Label>Select Date</Label>
          <Popover v-model:open="calendarOpen">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                :class="cn(
                  'w-[280px] justify-start text-left font-normal',
                  !selectedDate && 'text-muted-foreground'
                )"
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{ selectedDate ? format(selectedDate, 'PPP') : 'Pick a date' }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0">
              <Calendar
                v-model="selectedDate"
                @update:model-value="calendarOpen = false"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div class="space-y-2">
          <Label>Date Range</Label>
          <Popover v-model:open="rangeOpen">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                :class="cn(
                  'w-[300px] justify-start text-left font-normal',
                  !dateRange && 'text-muted-foreground'
                )"
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{ 
                  dateRange?.from 
                    ? dateRange.to 
                      ? `${format(dateRange.from, 'LLL dd, y')} - ${format(dateRange.to, 'LLL dd, y')}` 
                      : format(dateRange.from, 'LLL dd, y')
                    : 'Pick a date range' 
                }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
              <Calendar
                v-model="dateRange"
                mode="range"
                :number-of-months="2"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </section>

    <!-- Context Menu Example -->
    <section class="space-y-4">
      <h2 class="text-2xl font-bold">Context Menu</h2>
      <ContextMenu>
        <ContextMenuTrigger class="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
          Right click here
        </ContextMenuTrigger>
        <ContextMenuContent class="w-64">
          <ContextMenuItem>
            <User class="mr-2 h-4 w-4" />
            Profile
            <ContextMenuShortcut>⇧⌘P</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            <Settings class="mr-2 h-4 w-4" />
            Settings
            <ContextMenuShortcut>⌘,</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuCheckboxItem v-model:checked="showBookmarks">
            <BookmarkPlus class="mr-2 h-4 w-4" />
            Show Bookmarks
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuRadioGroup v-model="person">
            <ContextMenuLabel>People</ContextMenuLabel>
            <ContextMenuRadioItem value="pedro">
              Pedro Duarte
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value="colm">
              Colm Tuite
            </ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>
    </section>

    <!-- Drawer/Sheet Example -->
    <section class="space-y-4">
      <h2 class="text-2xl font-bold">Sheet (Drawer)</h2>
      <div class="flex gap-2">
        <Sheet v-model:open="sheetOpen">
          <SheetTrigger as-child>
            <Button variant="outline">Open Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit Profile</SheetTitle>
              <SheetDescription>
                Make changes to your profile here. Click save when you're done.
              </SheetDescription>
            </SheetHeader>
            <div class="grid gap-4 py-4">
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="name" class="text-right">
                  Name
                </Label>
                <Input id="name" value="Pedro Duarte" class="col-span-3" />
              </div>
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="username" class="text-right">
                  Username
                </Label>
                <Input id="username" value="@peduarte" class="col-span-3" />
              </div>
            </div>
            <SheetFooter>
              <SheetClose as-child>
                <Button type="submit">Save changes</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

// Component imports
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Calendar } from '@/components/ui/calendar'
import { ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuTrigger } from '@/components/ui/context-menu'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

// Icons
import { 
  ChevronsUpDown, 
  Check, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Calendar as CalendarIcon,
  User,
  Settings,
  BookmarkPlus
} from 'lucide-vue-next'

// Combobox data and state
const frameworks = [
  { value: 'vue', label: 'Vue.js' },
  { value: 'react', label: 'React' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'SolidJS' },
]

const comboboxOpen = ref(false)
const selectedFramework = ref('')

// Select state
const selectedTheme = ref('')
const selectedFont = ref('')

// Toggle groups state
const textAlign = ref('')
const textFormats = ref([])

// Collapsible state
const collapsibleOpen = ref(false)

// Progress state
const progressValue = ref(33)
const volumeValue = ref([50])

const increaseProgress = () => {
  progressValue.value = Math.min(progressValue.value + 10, 100)
}

const decreaseProgress = () => {
  progressValue.value = Math.max(progressValue.value - 10, 0)
}

// Calendar state
const calendarOpen = ref(false)
const rangeOpen = ref(false)
const selectedDate = ref<Date>()
const dateRange = ref<{from: Date, to?: Date}>()

// Context menu state
const showBookmarks = ref(true)
const person = ref('pedro')

// Sheet state
const sheetOpen = ref(false)
</script>