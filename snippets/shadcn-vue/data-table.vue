<!-- Advanced Data Table with shadcn-vue and TanStack Table -->
<template>
  <div class="space-y-4">
    <!-- Table Controls -->
    <div class="flex items-center justify-between">
      <div class="flex flex-1 items-center space-x-2">
        <Input
          v-model="globalFilter"
          placeholder="Filter tasks..."
          class="h-8 w-[150px] lg:w-[250px]"
        />
        <Select v-model="statusFilter">
          <SelectTrigger class="h-8 w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="backlog">Backlog</SelectItem>
            <SelectItem value="todo">Todo</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="priorityFilter">
          <SelectTrigger class="h-8 w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTableViewOptions :table="table" />
    </div>

    <!-- Table -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :class="header.column.getCanSort() ? 'cursor-pointer select-none' : ''"
              @click="header.column.getCanSort() ? header.column.getToggleSortingHandler()?.() : undefined"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
              <component
                :is="getSortingIcon(header.column.getIsSorted())"
                v-if="header.column.getCanSort()"
                class="ml-2 h-4 w-4"
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
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
              >
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

    <!-- Pagination -->
    <DataTablePagination :table="table" />

    <!-- Selected Row Actions -->
    <div v-if="selectedRows.length > 0" class="flex items-center space-x-2">
      <div class="text-sm text-muted-foreground">
        {{ selectedRows.length }} row(s) selected
      </div>
      <Button
        variant="outline"
        size="sm"
        @click="deleteSelected"
      >
        <Trash2 class="mr-2 h-4 w-4" />
        Delete Selected
      </Button>
      <Button
        variant="outline"
        size="sm"
        @click="exportSelected"
      >
        <Download class="mr-2 h-4 w-4" />
        Export Selected
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState
} from '@tanstack/vue-table'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Trash2,
  Download,
  Eye,
  Edit,
  Copy
} from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Types
interface Task {
  id: string
  code: string
  title: string
  status: 'backlog' | 'todo' | 'in-progress' | 'done' | 'canceled'
  priority: 'low' | 'medium' | 'high'
  assignee: string
  createdAt: Date
}

// Sample data
const data = ref<Task[]>([
  {
    id: '1',
    code: 'TASK-8782',
    title: 'You can\'t compress the program without quantifying the open-source SSD pixel!',
    status: 'in-progress',
    priority: 'medium',
    assignee: 'John Doe',
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    code: 'TASK-7878',
    title: 'Try to calculate the EXE feed, maybe it will index the multi-byte pixel!',
    status: 'backlog',
    priority: 'high',
    assignee: 'Jane Smith',
    createdAt: new Date('2024-01-10')
  },
  {
    id: '3',
    code: 'TASK-7839',
    title: 'We need to bypass the neural TCP card!',
    status: 'todo',
    priority: 'high',
    assignee: 'Bob Johnson',
    createdAt: new Date('2024-01-20')
  },
  {
    id: '4',
    code: 'TASK-5562',
    title: 'The SAS interface is down, bypass the open-source pixel so we can back up the PNG bandwidth!',
    status: 'done',
    priority: 'medium',
    assignee: 'Alice Brown',
    createdAt: new Date('2024-01-05')
  },
  {
    id: '5',
    code: 'TASK-8686',
    title: 'I\'ll parse the wireless SSL protocol, that should driver the API panel!',
    status: 'canceled',
    priority: 'low',
    assignee: 'Charlie Wilson',
    createdAt: new Date('2024-01-25')
  }
])

// Table state
const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})
const globalFilter = ref('')
const statusFilter = ref('all')
const priorityFilter = ref('all')

// Status badge variant mapping
const statusVariants = {
  backlog: 'secondary',
  todo: 'destructive',
  'in-progress': 'default',
  done: 'outline',
  canceled: 'secondary'
}

const priorityVariants = {
  low: 'secondary',
  medium: 'default',
  high: 'destructive'
}

// Table columns definition
const columns: ColumnDef<Task>[] = [
  {
    id: 'select',
    header: ({ table }) => h(Checkbox, {
      checked: table.getIsAllPageRowsSelected(),
      'onUpdate:checked': (value: boolean) => table.toggleAllPageRowsSelected(!!value),
      ariaLabel: 'Select all',
    }),
    cell: ({ row }) => h(Checkbox, {
      checked: row.getIsSelected(),
      'onUpdate:checked': (value: boolean) => row.toggleSelected(!!value),
      ariaLabel: 'Select row',
    }),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'code',
    header: 'Task',
    cell: ({ row }) => {
      const code = row.getValue('code') as string
      return h('div', { class: 'font-medium' }, code)
    },
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => {
      const title = row.getValue('title') as string
      return h('div', { class: 'max-w-[500px] truncate font-medium' }, title)
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return h(Badge, {
        variant: statusVariants[status] || 'default',
        class: 'capitalize'
      }, () => status.replace('-', ' '))
    },
    filterFn: (row, id, value) => {
      return value === 'all' || row.getValue(id) === value
    },
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => {
      const priority = row.getValue('priority') as string
      return h(Badge, {
        variant: priorityVariants[priority] || 'default',
        class: 'capitalize'
      }, () => priority)
    },
    filterFn: (row, id, value) => {
      return value === 'all' || row.getValue(id) === value
    },
  },
  {
    accessorKey: 'assignee',
    header: 'Assignee',
    cell: ({ row }) => {
      const assignee = row.getValue('assignee') as string
      return h('div', { class: 'font-medium' }, assignee)
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as Date
      return h('div', { class: 'font-medium' }, 
        date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      )
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const task = row.original
      return h('div', { class: 'relative' }, [
        h(DropdownMenu, {}, {
          default: () => [
            h(DropdownMenuTrigger, { asChild: true }, {
              default: () => h(Button, {
                variant: 'ghost',
                class: 'flex h-8 w-8 p-0 data-[state=open]:bg-muted'
              }, {
                default: () => [
                  h(MoreHorizontal, { class: 'h-4 w-4' }),
                  h('span', { class: 'sr-only' }, 'Open menu')
                ]
              })
            }),
            h(DropdownMenuContent, { align: 'end', class: 'w-[160px]' }, {
              default: () => [
                h(DropdownMenuLabel, {}, () => 'Actions'),
                h(DropdownMenuItem, {
                  onClick: () => copyTaskId(task.id)
                }, {
                  default: () => [
                    h(Copy, { class: 'mr-2 h-4 w-4' }),
                    'Copy ID'
                  ]
                }),
                h(DropdownMenuSeparator),
                h(DropdownMenuItem, {
                  onClick: () => viewTask(task)
                }, {
                  default: () => [
                    h(Eye, { class: 'mr-2 h-4 w-4' }),
                    'View'
                  ]
                }),
                h(DropdownMenuItem, {
                  onClick: () => editTask(task)
                }, {
                  default: () => [
                    h(Edit, { class: 'mr-2 h-4 w-4' }),
                    'Edit'
                  ]
                }),
                h(DropdownMenuSeparator),
                h(DropdownMenuItem, {
                  onClick: () => deleteTask(task.id),
                  class: 'text-red-600'
                }, {
                  default: () => [
                    h(Trash2, { class: 'mr-2 h-4 w-4' }),
                    'Delete'
                  ]
                })
              ]
            })
          ]
        })
      ])
    },
  },
]

// Table instance
const table = useVueTable({
  data: data.value,
  columns,
  onSortingChange: updaterOrValue => {
    sorting.value = typeof updaterOrValue === 'function' 
      ? updaterOrValue(sorting.value) 
      : updaterOrValue
  },
  onColumnFiltersChange: updaterOrValue => {
    columnFilters.value = typeof updaterOrValue === 'function'
      ? updaterOrValue(columnFilters.value)
      : updaterOrValue
  },
  onColumnVisibilityChange: updaterOrValue => {
    columnVisibility.value = typeof updaterOrValue === 'function'
      ? updaterOrValue(columnVisibility.value)
      : updaterOrValue
  },
  onRowSelectionChange: updaterOrValue => {
    rowSelection.value = typeof updaterOrValue === 'function'
      ? updaterOrValue(rowSelection.value)
      : updaterOrValue
  },
  onGlobalFilterChange: globalFilter.value,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
    get rowSelection() { return rowSelection.value },
    get globalFilter() { return globalFilter.value }
  },
})

// Computed values
const selectedRows = computed(() => {
  return table.getFilteredSelectedRowModel().rows.map(row => row.original)
})

// Watchers for filters
watch(statusFilter, (newValue) => {
  table.getColumn('status')?.setFilterValue(newValue)
})

watch(priorityFilter, (newValue) => {
  table.getColumn('priority')?.setFilterValue(newValue)
})

watch(globalFilter, (newValue) => {
  table.setGlobalFilter(newValue)
})

// Utility functions
const getSortingIcon = (sortDirection: string | false) => {
  if (sortDirection === 'asc') return ArrowUp
  if (sortDirection === 'desc') return ArrowDown
  return ArrowUpDown
}

// Action handlers
const copyTaskId = (taskId: string) => {
  navigator.clipboard.writeText(taskId)
  // In a real app, you'd show a toast notification here
  console.log('Task ID copied:', taskId)
}

const viewTask = (task: Task) => {
  console.log('View task:', task)
  // Open task details modal/page
}

const editTask = (task: Task) => {
  console.log('Edit task:', task)
  // Open task edit form
}

const deleteTask = (taskId: string) => {
  const index = data.value.findIndex(task => task.id === taskId)
  if (index > -1) {
    data.value.splice(index, 1)
  }
}

const deleteSelected = () => {
  const selectedIds = selectedRows.value.map(row => row.id)
  data.value = data.value.filter(task => !selectedIds.includes(task.id))
  rowSelection.value = {}
}

const exportSelected = () => {
  const selectedData = selectedRows.value
  const csvContent = 'data:text/csv;charset=utf-8,' + 
    'ID,Code,Title,Status,Priority,Assignee,Created\n' +
    selectedData.map(row => 
      `${row.id},"${row.code}","${row.title}",${row.status},${row.priority},"${row.assignee}",${row.createdAt.toISOString()}`
    ).join('\n')
  
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', 'selected_tasks.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Table view options component
const DataTableViewOptions = {
  name: 'DataTableViewOptions',
  props: ['table'],
  template: `
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline" size="sm" class="ml-auto hidden h-8 lg:flex">
          <SlidersHorizontal class="mr-2 h-4 w-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-[150px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <template v-for="column in table.getAllColumns().filter(column => typeof column.accessorFn !== 'undefined' && column.getCanHide())" :key="column.id">
          <DropdownMenuCheckboxItem
            :checked="column.getIsVisible()"
            @update:checked="(value) => column.toggleVisibility(!!value)"
          >
            {{ column.id }}
          </DropdownMenuCheckboxItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenu>
  `,
  components: {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem: {
      template: '<div @click="$emit(\'update:checked\', !checked)" class="flex items-center space-x-2 px-2 py-1 cursor-pointer hover:bg-muted"><input type="checkbox" :checked="checked" class="pointer-events-none"><span><slot /></span></div>',
      props: ['checked'],
      emits: ['update:checked']
    },
    Button
  }
}

// Pagination component
const DataTablePagination = {
  name: 'DataTablePagination',
  props: ['table'],
  template: `
    <div class="flex items-center justify-between px-2">
      <div class="flex-1 text-sm text-muted-foreground">
        {{ table.getFilteredSelectedRowModel().rows.length }} of {{ table.getFilteredRowModel().rows.length }} row(s) selected.
      </div>
      <div class="flex items-center space-x-6 lg:space-x-8">
        <div class="flex items-center space-x-2">
          <p class="text-sm font-medium">Rows per page</p>
          <Select :value="String(table.getState().pagination.pageSize)" @update:value="table.setPageSize">
            <SelectTrigger class="h-8 w-[70px]">
              <SelectValue :placeholder="String(table.getState().pagination.pageSize)" />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="40">40</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {{ table.getState().pagination.pageIndex + 1 }} of {{ table.getPageCount() }}
        </div>
        <div class="flex items-center space-x-2">
          <Button variant="outline" class="h-8 w-8 p-0" :disabled="!table.getCanPreviousPage()" @click="table.setPageIndex(0)">
            <span class="sr-only">Go to first page</span>
            <ChevronsLeft class="h-4 w-4" />
          </Button>
          <Button variant="outline" class="h-8 w-8 p-0" :disabled="!table.getCanPreviousPage()" @click="table.previousPage()">
            <span class="sr-only">Go to previous page</span>
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <Button variant="outline" class="h-8 w-8 p-0" :disabled="!table.getCanNextPage()" @click="table.nextPage()">
            <span class="sr-only">Go to next page</span>
            <ChevronRight class="h-4 w-4" />
          </Button>
          <Button variant="outline" class="h-8 w-8 p-0" :disabled="!table.getCanNextPage()" @click="table.setPageIndex(table.getPageCount() - 1)">
            <span class="sr-only">Go to last page</span>
            <ChevronsRight class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  `,
  components: {
    Button,
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
  }
}
</script>