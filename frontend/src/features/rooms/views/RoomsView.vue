<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { AlertCircle, Pencil, Plus, Trash2 } from 'lucide-vue-next'

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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

import { useAuth } from '@/features/auth/composables/useAuth'

import {
  createRoom,
  deleteRoom,
  listRooms,
  updateRoom,
} from '@/shared/api/resources'

const route = useRoute()
const { session } = useAuth()

const routeTenantSlug = computed(() => {
  const value = route.params.tenantSlug
  return Array.isArray(value) ? value[0] : value
})

const tenantId = computed(() =>
  routeTenantSlug.value || session.value?.tenantId || '',
)

const rooms = ref<any[]>([])

const editingRoom = ref<any | null>(null)
const deletingRoom = ref<any | null>(null)

const isLoading = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)

const isDialogOpen = ref(false)
const isDeleteOpen = ref(false)

const errorMessage = ref('')
const formError = ref('')

const form = reactive({
  name: '',
  type: 'public',
  ratePerHour: '',
  seats: '',
})

async function loadRooms() {
  if (!tenantId.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    rooms.value = await listRooms(
      tenantId.value,
      session.value?.accessToken,
    )
  }
  catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not load rooms'
  }
  finally {
    isLoading.value = false
  }
}

function resetForm() {
  editingRoom.value = null

  form.name = ''
  form.type = 'public'
  form.ratePerHour = ''
  form.seats = ''

  formError.value = ''
}

function openCreate() {
  resetForm()
  isDialogOpen.value = true
}

function openEdit(room: any) {
  resetForm()

  editingRoom.value = room

  form.name = room.name
  form.type = room.type
  form.ratePerHour = String(room.ratePerHour)
  form.seats = room.seats
    ? String(room.seats)
    : ''

  isDialogOpen.value = true
}

function validateForm() {
  if (!form.name.trim()) {
    return 'Name is required.'
  }

  const rate = Number(form.ratePerHour)

  if (!Number.isFinite(rate) || rate < 0) {
    return 'Rate per hour must be valid.'
  }

  if (form.type === 'public') {
    const seats = Number(form.seats)

    if (!Number.isFinite(seats) || seats <= 0) {
      return 'Seats must be greater than zero.'
    }
  }

  return ''
}

async function saveRoom() {
  const validationError = validateForm()

  if (validationError) {
    formError.value = validationError
    return
  }

  isSaving.value = true
  formError.value = ''

  const payload: any = {
    name: form.name.trim(),
    type: form.type,
    ratePerHour: Number(form.ratePerHour),
  }

  if (form.type === 'public') {
    payload.seats = Number(form.seats)
  }

  try {
    if (editingRoom.value) {
      await updateRoom(
        tenantId.value,
        editingRoom.value._id,
        payload,
        session.value?.accessToken,
      )
    }
    else {
      await createRoom(
        tenantId.value,
        payload,
        session.value?.accessToken,
      )
    }

    isDialogOpen.value = false

    resetForm()

    await loadRooms()
  }
  catch (error) {
    formError.value =
      error instanceof Error
        ? error.message
        : 'Could not save room'
  }
  finally {
    isSaving.value = false
  }
}

function openDelete(room: any) {
  deletingRoom.value = room
  isDeleteOpen.value = true
}

async function confirmDelete() {
  if (!deletingRoom.value) {
    return
  }

  isDeleting.value = true

  try {
    await deleteRoom(
      tenantId.value,
      deletingRoom.value._id,
      session.value?.accessToken,
    )

    isDeleteOpen.value = false
    deletingRoom.value = null

    await loadRooms()
  }
  catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not delete room'
  }
  finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  void loadRooms()
})

watch(tenantId, () => {
  void loadRooms()
})
</script>

<template>
  <section class="grid gap-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          Rooms
        </h1>

        <p class="text-sm text-muted-foreground">
          Manage workspace rooms.
        </p>
      </div>

      <Button @click="openCreate">
        <Plus class="h-4 w-4" />
        New Room
      </Button>
    </div>

    <Alert
      v-if="errorMessage"
      variant="destructive"
    >
      <AlertCircle class="h-4 w-4" />

      <AlertTitle>Error</AlertTitle>

      <AlertDescription>
        {{ errorMessage }}
      </AlertDescription>
    </Alert>

    <div class="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Rate / Hour</TableHead>
            <TableHead>Seats</TableHead>
            <TableHead class="w-32 text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <TableRow v-if="isLoading">
            <TableCell colspan="5">
              Loading rooms...
            </TableCell>
          </TableRow>

          <template v-else>
            <TableRow
              v-for="room in rooms"
              :key="room._id"
            >
              <TableCell class="font-medium">
                {{ room.name }}
              </TableCell>

              <TableCell>
                {{ room.type }}
              </TableCell>

              <TableCell>
                {{ room.ratePerHour }}
              </TableCell>

              <TableCell>
                {{ room.seats || '-' }}
              </TableCell>

              <TableCell>
                <div class="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    @click="openEdit(room)"
                  >
                    <Pencil class="h-4 w-4" />
                  </Button>

                  <Button
                    variant="destructive"
                    size="icon-sm"
                    @click="openDelete(room)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </template>

          <TableRow
            v-if="!isLoading && rooms.length === 0"
          >
            <TableCell colspan="5">
              No rooms yet.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <Dialog v-model:open="isDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {{
              editingRoom
                ? 'Edit Room'
                : 'Create Room'
            }}
          </DialogTitle>

          <DialogDescription>
            Configure workspace rooms.
          </DialogDescription>
        </DialogHeader>

        <form
          class="grid gap-4"
          @submit.prevent="saveRoom"
        >
          <Alert
            v-if="formError"
            variant="destructive"
          >
            <AlertCircle class="h-4 w-4" />

            <AlertTitle>Error</AlertTitle>

            <AlertDescription>
              {{ formError }}
            </AlertDescription>
          </Alert>

          <div class="grid gap-2">
            <Label>Name</Label>

            <Input v-model="form.name" />
          </div>

          <div class="grid gap-2">
            <Label>Type</Label>

            <select
              v-model="form.type"
              class="border rounded-md h-10 px-3"
            >
              <option value="private">
                Private
              </option>

              <option value="public">
                Public
              </option>
            </select>
          </div>

          <div class="grid gap-2">
            <Label>Rate Per Hour</Label>

            <Input
              v-model="form.ratePerHour"
              type="number"
            />
          </div>

          <div class="grid gap-2">
            <Label>Seats</Label>

            <Input
              v-model="form.seats"
              type="number"
              :disabled="form.type !== 'public'"
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

    <AlertDialog v-model:open="isDeleteOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete room?
          </AlertDialogTitle>

          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            :disabled="isDeleting"
            @click="confirmDelete"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>
</template>