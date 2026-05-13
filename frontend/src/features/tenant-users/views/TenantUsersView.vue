<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  createTenantUser,
  deleteTenantUser,
  listTenantUsers,
  updateTenantUser,
} from '@/shared/api/resources'
import type { User } from '@/shared/types/api'
import { useAuth } from '@/features/auth/composables/useAuth'

const { session } = useAuth()
const route = useRoute()
const router = useRouter()
const routeTenantSlug = computed(() => {
  const value = route.params.tenantSlug
  return Array.isArray(value) ? value[0] : value
})
const selectedTenantId = ref(routeTenantSlug.value || session.value?.tenantId || '')
const users = ref<User[]>([])
const editingUser = ref<User | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)
const isDialogOpen = ref(false)
const errorMessage = ref('')

const canLoad = computed(() => selectedTenantId.value.trim().length > 0)

const form = reactive({
  name: '',
  email: '',
  password: '',
})

function resetForm() {
  editingUser.value = null
  form.name = ''
  form.email = ''
  form.password = ''
}

async function loadUsers() {
  if (!canLoad.value) {
    errorMessage.value = 'Enter a tenant id first'
    return
  }

  if (selectedTenantId.value !== routeTenantSlug.value) {
    await router.push({
      name: 'tenant-users',
      params: { tenantSlug: selectedTenantId.value },
    })
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    users.value = await listTenantUsers(selectedTenantId.value, session.value?.accessToken)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not load tenant users'
  } finally {
    isLoading.value = false
  }
}

function openCreate() {
  resetForm()
  isDialogOpen.value = true
}

function openEdit(user: User) {
  editingUser.value = user
  form.name = user.name
  form.email = user.email
  form.password = ''
  isDialogOpen.value = true
}

async function saveUser() {
  isSaving.value = true
  errorMessage.value = ''

  try {
    if (editingUser.value) {
      await updateTenantUser(selectedTenantId.value, editingUser.value.id, {
        name: form.name,
        email: form.email,
        password: form.password || undefined,
      }, session.value?.accessToken)
    } else {
      await createTenantUser(selectedTenantId.value, {
        name: form.name,
        email: form.email,
        password: form.password,
      }, session.value?.accessToken)
    }

    isDialogOpen.value = false
    resetForm()
    await loadUsers()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not save tenant user'
  } finally {
    isSaving.value = false
  }
}

async function removeUser(user: User) {
  errorMessage.value = ''

  try {
    await deleteTenantUser(selectedTenantId.value, user.id, session.value?.accessToken)
    await loadUsers()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not delete tenant user'
  }
}

onMounted(() => {
  if (selectedTenantId.value) {
    void loadUsers()
  }
})

watch(routeTenantSlug, (tenantSlug) => {
  selectedTenantId.value = tenantSlug || session.value?.tenantId || ''

  if (selectedTenantId.value) {
    void loadUsers()
  }
})
</script>

<template>
  <section class="grid gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          Tenant Users
        </h1>
        <p class="text-sm text-muted-foreground">
          Manage users inside a selected workspace.
        </p>
      </div>
      <Button
        :disabled="!canLoad"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        New User
      </Button>
    </div>

    <div class="flex flex-wrap items-end gap-3">
      <div class="grid w-full max-w-sm gap-2">
        <Label for="selected-tenant">Tenant ID</Label>
        <Input
          id="selected-tenant"
          v-model="selectedTenantId"
          :disabled="session?.type === 'tenant'"
          placeholder="workspace-slug"
        />
      </div>
      <Button
        variant="outline"
        :disabled="!canLoad || isLoading"
        @click="loadUsers"
      >
        <Search class="h-4 w-4" />
        Load Users
      </Button>
    </div>

    <p
      v-if="errorMessage"
      class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {{ errorMessage }}
    </p>

    <div class="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead class="w-32 text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="isLoading">
            <TableCell
              colspan="3"
              class="text-muted-foreground"
            >
              Loading tenant users...
            </TableCell>
          </TableRow>
          <template v-else>
            <TableRow
              v-for="user in users"
              :key="user.id"
            >
              <TableCell class="font-medium">
                {{ user.name }}
              </TableCell>
              <TableCell>{{ user.email }}</TableCell>
              <TableCell>
                <div class="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Edit tenant user"
                    @click="openEdit(user)"
                  >
                    <Pencil class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    aria-label="Delete tenant user"
                    @click="removeUser(user)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-if="!isLoading && users.length === 0">
            <TableCell
              colspan="3"
              class="text-muted-foreground"
            >
              No tenant users loaded.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <Dialog v-model:open="isDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ editingUser ? 'Edit Tenant User' : 'Create Tenant User' }}</DialogTitle>
          <DialogDescription>
            {{ editingUser ? 'Leave password blank to keep it unchanged.' : `Create a user inside ${selectedTenantId}.` }}
          </DialogDescription>
        </DialogHeader>

        <form
          class="grid gap-4"
          @submit.prevent="saveUser"
        >
          <div class="grid gap-2">
            <Label for="tenant-user-name">Name</Label>
            <Input
              id="tenant-user-name"
              v-model="form.name"
              required
            />
          </div>
          <div class="grid gap-2">
            <Label for="tenant-user-email">Email</Label>
            <Input
              id="tenant-user-email"
              v-model="form.email"
              type="email"
              required
            />
          </div>
          <div class="grid gap-2">
            <Label for="tenant-user-password">Password</Label>
            <Input
              id="tenant-user-password"
              v-model="form.password"
              type="password"
              minlength="6"
              :required="!editingUser"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              @click="isDialogOpen = false"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              :disabled="isSaving"
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </section>
</template>
