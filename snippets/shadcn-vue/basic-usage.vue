<!-- Basic shadcn-vue Component Usage Examples -->
<template>
  <div class="container mx-auto p-4 space-y-8">
    <!-- Button Examples -->
    <section class="space-y-4">
      <h2 class="text-2xl font-bold">Button Components</h2>
      <div class="flex gap-2 flex-wrap">
        <Button>Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <div class="flex gap-2 flex-wrap">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon">
          <Plus class="h-4 w-4" />
        </Button>
      </div>
    </section>

    <!-- Form Elements -->
    <section class="space-y-4">
      <h2 class="text-2xl font-bold">Form Elements</h2>
      <div class="max-w-sm space-y-4">
        <div>
          <Label for="email">Email</Label>
          <Input id="email" type="email" placeholder="Enter your email" />
        </div>
        <div>
          <Label for="password">Password</Label>
          <Input id="password" type="password" placeholder="Enter your password" />
        </div>
        <div class="flex items-center space-x-2">
          <Checkbox id="terms" />
          <Label for="terms">Accept terms and conditions</Label>
        </div>
        <div class="flex items-center space-x-2">
          <Switch id="notifications" />
          <Label for="notifications">Enable notifications</Label>
        </div>
      </div>
    </section>

    <!-- Card Layout -->
    <section class="space-y-4">
      <h2 class="text-2xl font-bold">Card Components</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description goes here</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the card content area where you can place any information.</p>
          </CardContent>
          <CardFooter class="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div class="flex items-center space-x-2">
              <Avatar>
                <AvatarImage src="https://github.com/unovue.png" />
                <AvatarFallback>UN</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle class="text-base">User Profile</CardTitle>
                <CardDescription>@unovue</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div class="flex gap-2">
              <Badge>Vue.js</Badge>
              <Badge variant="secondary">TypeScript</Badge>
              <Badge variant="outline">Open Source</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>

    <!-- Alerts -->
    <section class="space-y-4">
      <h2 class="text-2xl font-bold">Alert Components</h2>
      <Alert>
        <Terminal class="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          You can add components to your app using the cli.
        </AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Your session has expired. Please log in again.
        </AlertDescription>
      </Alert>
    </section>

    <!-- Dialog Example -->
    <section class="space-y-4">
      <h2 class="text-2xl font-bold">Dialog Component</h2>
      <Dialog v-model:open="dialogOpen">
        <DialogTrigger as-child>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="name" class="text-right">Name</Label>
              <Input id="name" value="Pedro Duarte" class="col-span-3" />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="username" class="text-right">Username</Label>
              <Input id="username" value="@peduarte" class="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>

    <!-- Tabs Example -->
    <section class="space-y-4">
      <h2 class="text-2xl font-bold">Tabs Component</h2>
      <Tabs default-value="account" class="w-[400px]">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account" class="space-y-4">
          <div class="space-y-2">
            <Label for="current">Current password</Label>
            <Input id="current" type="password" />
          </div>
          <div class="space-y-2">
            <Label for="new">New password</Label>
            <Input id="new" type="password" />
          </div>
        </TabsContent>
        <TabsContent value="password" class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Name</Label>
            <Input id="name" value="Pedro Duarte" />
          </div>
          <div class="space-y-2">
            <Label for="username">Username</Label>
            <Input id="username" value="@peduarte" />
          </div>
        </TabsContent>
      </Tabs>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Terminal, AlertCircle } from 'lucide-vue-next'

const dialogOpen = ref(false)
</script>