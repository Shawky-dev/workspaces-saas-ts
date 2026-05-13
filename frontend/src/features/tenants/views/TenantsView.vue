<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Pencil, Plus, Trash2, Users } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { createTenant, deleteTenant, listTenants, updateTenant } from '@/shared/api/resources'
import type { Tenant } from '@/shared/types/api'
import { useAuth } from '@/features/auth/composables/useAuth'

const { session } = useAuth()
const tenants = ref<Tenant[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const isDialogOpen = ref(false)
const editingTenant = ref<Tenant | null>(null)
const errorMessage = ref('')

const form = reactive({
  slug: '',
  name: '',
  enabled: true,
  adminName: '',
  adminEmail: '',
  adminPassword: '',
})

function resetForm() {
  form.slug = ''
  form.name = ''
  form.enabled = true
  form.adminName = ''
  form.adminEmail = ''
  form.adminPassword = ''
  editingTenant.value = null
}

async function loadTenants() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    tenants.value = await listTenants(session.value?.accessToken)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not load tenants'
  } finally {
    isLoading.value = false
  }
}

function openCreate() {
  resetForm()
  isDialogOpen.value = true
}

function openEdit(tenant: Tenant) {
  editingTenant.value = tenant
  form.slug = tenant.slug
  form.name = tenant.name
  form.enabled = tenant.enabled
  form.adminName = ''
  form.adminEmail = ''
  form.adminPassword = ''
  isDialogOpen.value = true
}

async function saveTenant() {
  isSaving.value = true
  errorMessage.value = ''

  try {
    if (editingTenant.value) {
      await updateTenant(editingTenant.value.slug, {
        name: form.name,
        enabled: form.enabled,
      }, session.value?.accessToken)
    } else {
      await createTenant({
        slug: form.slug,
        name: form.name,
        enabled: form.enabled,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
      }, session.value?.accessToken)
    }

    isDialogOpen.value = false
    resetForm()
    await loadTenants()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not save tenant'
  } finally {
    isSaving.value = false
  }
}

async function removeTenant(tenant: Tenant) {
  errorMessage.value = ''

  try {
    await deleteTenant(tenant.slug, session.value?.accessToken)
    await loadTenants()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not delete tenant'
  }
}

onMounted(loadTenants)
</script>

<template>
  <section class="grid gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          Tenants
        </h1>
        <p class="text-sm text-muted-foreground">
          Manage workspace records and create the first tenant admin.
        </p>
      </div>
      <Button @click="openCreate">
        <Plus class="h-4 w-4" />
        New Tenant
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
            <TableHead>Slug</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead class="w-44 text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="isLoading">
            <TableCell
              colspan="4"
              class="text-muted-foreground"
            >
              Loading tenants...
            </TableCell>
          </TableRow>
          <template v-else>
            <TableRow
              v-for="tenant in tenants"
              :key="tenant.slug"
            >
              <TableCell class="font-medium">
                {{ tenant.slug }}
              </TableCell>
              <TableCell>{{ tenant.name }}</TableCell>
              <TableCell>
                <Badge :variant="tenant.enabled ? 'default' : 'secondary'">
                  {{ tenant.enabled ? 'Enabled' : 'Disabled' }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="flex justify-end gap-2">
                <Button
                  as-child
                  variant="outline"
                  size="icon-sm"
                  aria-label="Open tenant users"
                >
                  <RouterLink :to="`/${tenant.slug}/users`">
                    <Users class="h-4 w-4" />
                  </RouterLink>
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Edit tenant"
                    @click="openEdit(tenant)"
                  >
                    <Pencil class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    aria-label="Delete tenant"
                    @click="removeTenant(tenant)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-if="!isLoading && tenants.length === 0">
            <TableCell
              colspan="4"
              class="text-muted-foreground"
            >
              No tenants yet.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <Dialog v-model:open="isDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ editingTenant ? 'Edit Tenant' : 'Create Tenant' }}</DialogTitle>
          <DialogDescription>
            {{ editingTenant ? 'Update workspace details.' : 'Create a workspace and seed its admin user.' }}
          </DialogDescription>
        </DialogHeader>

        <form
          class="grid gap-4"
          @submit.prevent="saveTenant"
        >
          <div class="grid gap-2">
            <Label for="tenant-slug">Slug</Label>
            <Input
              id="tenant-slug"
              v-model="form.slug"
              :disabled="Boolean(editingTenant)"
              required
            />
          </div>
          <div class="grid gap-2">
            <Label for="tenant-name">Name</Label>
            <Input
              id="tenant-name"
              v-model="form.name"
              required
            />
          </div>
          <label class="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              :model-value="form.enabled"
              @update:model-value="form.enabled = $event === true"
            />
            Enabled
          </label>

          <div
            v-if="!editingTenant"
            class="grid gap-4"
          >
            <div class="grid gap-2">
              <Label for="admin-name">Admin name</Label>
              <Input
                id="admin-name"
                v-model="form.adminName"
                required
              />
            </div>
            <div class="grid gap-2">
              <Label for="admin-email">Admin email</Label>
              <Input
                id="admin-email"
                v-model="form.adminEmail"
                type="email"
                required
              />
            </div>
            <div class="grid gap-2">
              <Label for="admin-password">Admin password</Label>
              <Input
                id="admin-password"
                v-model="form.adminPassword"
                type="password"
                minlength="6"
                required
              />
            </div>
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
