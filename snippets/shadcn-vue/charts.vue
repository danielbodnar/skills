<!-- shadcn-vue Charts Examples (Requires Vue 3.3+) -->
<template>
  <div class="container mx-auto p-4 space-y-8">
    <!-- Area Chart -->
    <Card>
      <CardHeader>
        <CardTitle>Area Chart - Stacked</CardTitle>
        <CardDescription>
          Showing total visitors for the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer :config="chartConfig" class="h-[300px]">
          <AreaChart
            :data="chartData"
            :margin="{ top: 10, right: 30, left: 0, bottom: 0 }"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content="<ChartTooltipContent />" />
            <Area
              type="monotone"
              dataKey="desktop"
              stackId="1"
              :stroke="chartConfig.desktop.color"
              :fill="chartConfig.desktop.color"
            />
            <Area
              type="monotone"
              dataKey="mobile"
              stackId="1"
              :stroke="chartConfig.mobile.color"
              :fill="chartConfig.mobile.color"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>

    <!-- Line Chart -->
    <Card>
      <CardHeader>
        <CardTitle>Line Chart - Multiple</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer :config="chartConfig" class="h-[300px]">
          <LineChart
            :data="chartData"
            :margin="{ top: 5, right: 30, left: 20, bottom: 5 }"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content="<ChartTooltipContent />" />
            <ChartLegend content="<ChartLegendContent />" />
            <Line
              type="monotone"
              dataKey="desktop"
              :stroke="chartConfig.desktop.color"
              strokeWidth="2"
            />
            <Line
              type="monotone"
              dataKey="mobile"
              :stroke="chartConfig.mobile.color"
              strokeWidth="2"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>

    <!-- Bar Chart -->
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Horizontal</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer :config="chartConfig" class="h-[300px]">
          <BarChart
            :data="chartData"
            layout="horizontal"
            :margin="{ top: 5, right: 30, left: 20, bottom: 5 }"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="month" type="category" />
            <ChartTooltip content="<ChartTooltipContent />" />
            <ChartLegend content="<ChartLegendContent />" />
            <Bar dataKey="desktop" :fill="chartConfig.desktop.color" />
            <Bar dataKey="mobile" :fill="chartConfig.mobile.color" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>

    <!-- Donut Chart -->
    <Card>
      <CardHeader>
        <CardTitle>Donut Chart - Interactive</CardTitle>
        <CardDescription>Visitor breakdown by device type</CardDescription>
      </CardHeader>
      <CardContent class="flex-1 pb-0">
        <ChartContainer
          :config="donutConfig"
          class="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content="<ChartTooltipContent hideLabel />"
            />
            <Pie
              :data="donutData"
              dataKey="visitors"
              nameKey="device"
              :innerRadius="60"
              strokeWidth="5"
            >
              <LabelList
                dataKey="device"
                className="fill-foreground"
                stroke="none"
                fontSize="12"
                formatter="(value) => donutConfig[value]?.label"
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>

    <!-- Custom Chart with Tooltip -->
    <Card>
      <CardHeader>
        <CardTitle>Custom Tooltip Chart</CardTitle>
        <CardDescription>
          Area chart with custom tooltip content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer :config="chartConfig" class="h-[300px]">
          <AreaChart :data="chartData">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content="<CustomChartTooltip />" />
            <Area
              type="monotone"
              dataKey="desktop"
              :stroke="chartConfig.desktop.color"
              :fill="chartConfig.desktop.color"
              fillOpacity="0.6"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>

    <!-- Chart with Controls -->
    <Card>
      <CardHeader class="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div class="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Interactive Chart</CardTitle>
          <CardDescription>
            Toggle data series and change chart type
          </CardDescription>
        </div>
        <Select v-model="chartType">
          <SelectTrigger class="w-[160px] rounded-lg sm:ml-auto">
            <SelectValue placeholder="Select chart type" />
          </SelectTrigger>
          <SelectContent class="rounded-xl">
            <SelectItem value="area" class="rounded-lg">
              Area Chart
            </SelectItem>
            <SelectItem value="line" class="rounded-lg">
              Line Chart
            </SelectItem>
            <SelectItem value="bar" class="rounded-lg">
              Bar Chart
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent class="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer :config="chartConfig" class="aspect-auto h-[250px] w-full">
          <component
            :is="getChartComponent(chartType)"
            :data="filteredChartData"
            :margin="{ left: 12, right: 12 }"
          >
            <CartesianGrid vertical="false" />
            <XAxis
              dataKey="month"
              tickLine="false"
              axisLine="false"
              tickMargin="8"
              minTickGap="32"
            />
            <ChartTooltip
              content="<ChartTooltipContent className='w-[150px]' nameKey='views' labelFormatter='(value) => `Month: ${value}`' />"
            />
            <component
              v-for="(config, key) in visibleSeries"
              :is="getDataComponent(chartType)"
              :key="key"
              :dataKey="key"
              type="monotone"
              :stroke="config.color"
              :fill="config.color"
              fillOpacity="0.4"
              strokeWidth="2"
            />
          </component>
        </ChartContainer>
      </CardContent>
      <CardFooter class="flex-col items-start gap-2 text-sm">
        <div class="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month
          <TrendingUp class="h-4 w-4" />
        </div>
        <div class="leading-none text-muted-foreground">
          Showing data for the last 6 months
        </div>
        <div class="flex gap-4 mt-2">
          <div class="flex items-center gap-2">
            <Checkbox 
              id="desktop" 
              :checked="activeSeries.includes('desktop')"
              @update:checked="toggleSeries('desktop')"
            />
            <Label for="desktop">Desktop</Label>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox 
              id="mobile" 
              :checked="activeSeries.includes('mobile')"
              @update:checked="toggleSeries('mobile')"
            />
            <Label for="mobile">Mobile</Label>
          </div>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { TrendingUp } from 'lucide-vue-next'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

// Chart data
const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
]

const donutData = [
  { device: 'desktop', visitors: 275, fill: 'var(--color-desktop)' },
  { device: 'mobile', visitors: 200, fill: 'var(--color-mobile)' },
  { device: 'tablet', visitors: 87, fill: 'var(--color-tablet)' },
]

// Chart configurations
const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'hsl(var(--chart-1))',
  },
  mobile: {
    label: 'Mobile',
    color: 'hsl(var(--chart-2))',
  },
}

const donutConfig = {
  visitors: {
    label: 'Visitors',
  },
  desktop: {
    label: 'Desktop',
    color: 'hsl(var(--chart-1))',
  },
  mobile: {
    label: 'Mobile',
    color: 'hsl(var(--chart-2))',
  },
  tablet: {
    label: 'Tablet',
    color: 'hsl(var(--chart-3))',
  },
}

// Interactive chart state
const chartType = ref('area')
const activeSeries = ref(['desktop', 'mobile'])

const visibleSeries = computed(() => {
  return Object.fromEntries(
    Object.entries(chartConfig).filter(([key]) => activeSeries.value.includes(key))
  )
})

const filteredChartData = computed(() => {
  return chartData.map(item => {
    const filtered = { month: item.month }
    activeSeries.value.forEach(series => {
      filtered[series] = item[series]
    })
    return filtered
  })
})

const getChartComponent = (type: string) => {
  switch (type) {
    case 'line': return LineChart
    case 'bar': return BarChart
    default: return AreaChart
  }
}

const getDataComponent = (type: string) => {
  switch (type) {
    case 'line': return Line
    case 'bar': return Bar
    default: return Area
  }
}

const toggleSeries = (series: string) => {
  const index = activeSeries.value.indexOf(series)
  if (index > -1) {
    if (activeSeries.value.length > 1) { // Keep at least one series active
      activeSeries.value.splice(index, 1)
    }
  } else {
    activeSeries.value.push(series)
  }
}

// Custom tooltip component
const CustomChartTooltip = {
  name: 'CustomChartTooltip',
  props: ['active', 'payload', 'label'],
  template: `
    <div v-if="active && payload && payload.length" class="rounded-lg border bg-background p-2 shadow-sm">
      <div class="grid grid-cols-2 gap-2">
        <div class="flex flex-col">
          <span class="text-[0.70rem] uppercase text-muted-foreground">
            {{ label }}
          </span>
          <span class="font-bold text-muted-foreground">
            {{ payload[0].value }}
          </span>
        </div>
      </div>
    </div>
  `
}
</script>