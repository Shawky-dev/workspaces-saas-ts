<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { loginCommon, loginTenant } = useAuth()

const commonEmail = ref('')
const commonPassword = ref('')
const tenantId = ref('')
const tenantEmail = ref('')
const tenantPassword = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function submitCommon() {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    await loginCommon(commonEmail.value, commonPassword.value)
    await router.push('/common')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Login failed'
  } finally {
    isSubmitting.value = false
  }
}

async function submitTenant() {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    await loginTenant(tenantId.value, tenantEmail.value, tenantPassword.value)
    await router.push(`/${tenantId.value}/sessions`)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Login failed'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>Workspace Admin</CardTitle>
        <CardDescription>
          Sign in as a common admin or a tenant user.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs default-value="common">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="common">
              Common Admin
            </TabsTrigger>
            <TabsTrigger value="tenant">
              Tenant User
            </TabsTrigger>
          </TabsList>

          <p
            v-if="errorMessage"
            class="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {{ errorMessage }}
          </p>

          <TabsContent
            value="common"
            class="mt-4"
          >
            <form
              class="grid gap-4"
              @submit.prevent="submitCommon"
            >
              <div class="grid gap-2">
                <Label for="common-email">Email</Label>
                <Input
                  id="common-email"
                  v-model="commonEmail"
                  type="email"
                  autocomplete="email"
                  required
                />
              </div>
              <div class="grid gap-2">
                <Label for="common-password">Password</Label>
                <Input
                  id="common-password"
                  v-model="commonPassword"
                  type="password"
                  autocomplete="current-password"
                  minlength="6"
                  required
                />
              </div>
              <Button
                type="submit"
                :disabled="isSubmitting"
              >
                Login
              </Button>
            </form>
          </TabsContent>

          <TabsContent
            value="tenant"
            class="mt-4"
          >
            <form
              class="grid gap-4"
              @submit.prevent="submitTenant"
            >
              <div class="grid gap-2">
                <Label for="tenant-id">Tenant ID</Label>
                <Input
                  id="tenant-id"
                  v-model="tenantId"
                  placeholder="workspace-slug"
                  required
                />
              </div>
              <div class="grid gap-2">
                <Label for="tenant-email">Email</Label>
                <Input
                  id="tenant-email"
                  v-model="tenantEmail"
                  type="email"
                  autocomplete="email"
                  required
                />
              </div>
              <div class="grid gap-2">
                <Label for="tenant-password">Password</Label>
                <Input
                  id="tenant-password"
                  v-model="tenantPassword"
                  type="password"
                  autocomplete="current-password"
                  minlength="6"
                  required
                />
              </div>
              <Button
                type="submit"
                :disabled="isSubmitting"
              >
                Login
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </main>
</template>
