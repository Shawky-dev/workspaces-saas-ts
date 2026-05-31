<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  XCircle,
} from 'lucide-vue-next'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useAuth } from '@/features/auth/composables/useAuth'
import {
  cancelReservation,
  confirmReservationArrival,
  createReservation,
  getReservationSettings,
  getReservationTimetable,
  listCustomers,
  listReservations,
  listRooms,
  updateReservation,
  updateReservationSettings,
} from '@/shared/api/resources'
import type {
  CreateReservationPayload,
  Customer,
  Reservation,
  ReservationSettings,
  ReservationTimetable,
  RoomAvailability,
} from '@/shared/types/api'

type Room = RoomAvailability & { _id?: string, seats?: number }

const route = useRoute()
const router = useRouter()
const { session } = useAuth()

const routeTenantSlug = computed(() => {
  const value = route.params.tenantSlug
  return Array.isArray(value) ? value[0] : value
})
const tenantId = computed(() => routeTenantSlug.value || session.value?.tenantId || '')

const reservations = ref<Reservation[]>([])
const timetable = ref<ReservationTimetable | null>(null)
const settings = ref<ReservationSettings | null>(null)
const customers = ref<Customer[]>([])
const rooms = ref<Room[]>([])
const editingReservation = ref<Reservation | null>(null)
const cancelingReservation = ref<Reservation | null>(null)
const arrivingReservation = ref<Reservation | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)
const isReservationOpen = ref(false)
const isCancelOpen = ref(false)
const isArrivalOpen = ref(false)
const errorMessage = ref('')
const formError = ref('')
const weekStart = ref(formatLocalDate(startOfWeek(new Date())))

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const slotOptions = [15, 30, 45, 60, 90, 120]

const reservationForm = reactive({
  customerMode: 'existing',
  customerId: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  email: '',
  selectedDate: '',
  startsAt: '',
  durationMinutes: 60,
  privateRooms: {} as Record<string, boolean>,
  publicSeats: {} as Record<string, number>,
})

const cancelForm = reactive({
  reason: '',
})

const settingsForm = reactive({
  timezone: 'Africa/Cairo',
  slotMinutes: 30,
  weeklyHours: [] as ReservationSettings['weeklyHours'],
})

const privateRooms = computed(() => rooms.value.filter(room => room.type === 'private'))
const publicRooms = computed(() => rooms.value.filter(room => room.type === 'public'))
const slotsByDate = computed(() => {
  const map = new Map<string, ReservationTimetable['slots']>()

  for (const slot of timetable.value?.slots ?? []) {
    const dateKey = slot.date
    map.set(dateKey, [...(map.get(dateKey) ?? []), slot])
  }

  return map
})
const weekDates = computed(() => {
  const start = new Date(`${weekStart.value}T00:00:00`)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
})
const availableDateOptions = computed(() => {
  return Array.from(slotsByDate.value.keys()).map((dateKey) => {
    const date = new Date(`${dateKey}T00:00:00`)
    return {
      value: dateKey,
      label: `${dayNames[date.getDay()]} ${dateKey}`,
    }
  })
})
const availableStartSlots = computed(() => {
  if (!reservationForm.selectedDate) {
    return []
  }

  return slotsByDate.value.get(reservationForm.selectedDate) ?? []
})
const durationOptions = computed(() => {
  const slotMinutes = settings.value?.slotMinutes ?? settingsForm.slotMinutes
  return Array.from({ length: 8 }, (_, index) => slotMinutes * (index + 1))
})

function startOfWeek(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  next.setDate(next.getDate() - next.getDay())
  return next
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function customerName(customer: Reservation['customer']) {
  return `${customer.firstName} ${customer.lastName}`.trim()
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatResourceSummary(reservation: Reservation) {
  return reservation.roomBookings
    .map(booking => booking.type === 'public'
      ? `${booking.roomName} (${booking.seatCount} seats)`
      : booking.roomName)
    .join(', ')
}

function syncSettingsForm(nextSettings: ReservationSettings) {
  settingsForm.timezone = nextSettings.timezone
  settingsForm.slotMinutes = nextSettings.slotMinutes
  settingsForm.weeklyHours = normalizeWeeklyHours(nextSettings.weeklyHours)
}

function normalizeWeeklyHours(weeklyHours: ReservationSettings['weeklyHours']) {
  return weeklyHours.map(day => ({
    dayOfWeek: day.dayOfWeek,
    enabled: day.enabled,
    opensAt: day.opensAt,
    closesAt: day.closesAt,
  }))
}

function defaultWeeklyHours() {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    enabled: dayOfWeek >= 1 && dayOfWeek <= 5,
    opensAt: '09:00',
    closesAt: '17:00',
  }))
}

async function loadData() {
  if (!tenantId.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const [nextSettings, nextTimetable, nextReservations, nextCustomers, nextRooms] = await Promise.all([
      getReservationSettings(tenantId.value, session.value?.accessToken),
      getReservationTimetable(tenantId.value, weekStart.value, session.value?.accessToken),
      listReservations(tenantId.value, weekStart.value, session.value?.accessToken),
      listCustomers(tenantId.value, session.value?.accessToken),
      listRooms(tenantId.value, session.value?.accessToken) as Promise<any[]>,
    ])

    settings.value = nextSettings
    timetable.value = nextTimetable
    reservations.value = nextReservations
    customers.value = nextCustomers
    rooms.value = nextRooms.map(room => ({
      ...room,
      id: room._id,
      totalSeats: room.type === 'public' ? room.seats ?? 0 : 1,
      availableSeats: room.type === 'public' ? room.seats ?? 0 : 1,
      occupiedSeats: 0,
      isAvailable: true,
    }))
    syncSettingsForm(nextSettings)

    if (!reservationForm.customerId && nextCustomers.length > 0) {
      reservationForm.customerId = nextCustomers[0]._id
    }

    if (!reservationForm.selectedDate && availableDateOptions.value.length > 0) {
      reservationForm.selectedDate = availableDateOptions.value[0].value
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not load reservations'
  } finally {
    isLoading.value = false
  }
}

function resetReservationForm() {
  editingReservation.value = null
  reservationForm.customerMode = 'existing'
  reservationForm.customerId = customers.value[0]?._id || ''
  reservationForm.firstName = ''
  reservationForm.lastName = ''
  reservationForm.phoneNumber = ''
  reservationForm.email = ''
  reservationForm.selectedDate = availableDateOptions.value[0]?.value || ''
  reservationForm.startsAt = ''
  reservationForm.durationMinutes = settings.value?.slotMinutes ?? 30
  reservationForm.privateRooms = {}
  reservationForm.publicSeats = {}
  formError.value = ''
}

function openCreateReservation() {
  resetReservationForm()
  isReservationOpen.value = true
}

function openEditReservation(reservation: Reservation) {
  resetReservationForm()
  editingReservation.value = reservation
  reservationForm.customerId = reservation.customer.customerId
  reservationForm.selectedDate = formatLocalDate(new Date(reservation.startsAt))
  reservationForm.startsAt = reservation.startsAt
  reservationForm.durationMinutes = Math.max(
    settings.value?.slotMinutes ?? 30,
    Math.round((new Date(reservation.endsAt).getTime() - new Date(reservation.startsAt).getTime()) / 60000),
  )

  for (const booking of reservation.roomBookings) {
    if (booking.type === 'private') {
      reservationForm.privateRooms[booking.roomId] = true
    } else {
      reservationForm.publicSeats[booking.roomId] = booking.seatCount
    }
  }

  isReservationOpen.value = true
}

function selectedRoomBookings() {
  const roomBookings: CreateReservationPayload['roomBookings'] = []

  for (const room of privateRooms.value) {
    if (reservationForm.privateRooms[room.id]) {
      roomBookings.push({ roomId: room.id, seatCount: 1 })
    }
  }

  for (const room of publicRooms.value) {
    const seatCount = Number(reservationForm.publicSeats[room.id] || 0)

    if (seatCount > 0) {
      roomBookings.push({ roomId: room.id, seatCount })
    }
  }

  return roomBookings
}

function buildReservationPayload(): CreateReservationPayload | null {
  const roomBookings = selectedRoomBookings()

  if (!reservationForm.startsAt) {
    formError.value = 'Choose a start time.'
    return null
  }

  if (roomBookings.length === 0) {
    formError.value = 'Select at least one private room or public seat.'
    return null
  }

  const startsAt = new Date(reservationForm.startsAt)
  const endsAt = new Date(startsAt.getTime() + Number(reservationForm.durationMinutes) * 60000)
  const payload: CreateReservationPayload = {
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    roomBookings,
  }

  if (reservationForm.customerMode === 'existing') {
    if (!reservationForm.customerId) {
      formError.value = 'Select a customer.'
      return null
    }

    payload.customerId = reservationForm.customerId
  } else {
    if (!reservationForm.firstName.trim() || !reservationForm.lastName.trim() || !reservationForm.phoneNumber.trim()) {
      formError.value = 'Enter first name, last name, and phone number.'
      return null
    }

    payload.customer = {
      firstName: reservationForm.firstName.trim(),
      lastName: reservationForm.lastName.trim(),
      phoneNumber: reservationForm.phoneNumber.trim(),
      email: reservationForm.email.trim() || undefined,
    }
  }

  return payload
}

async function saveReservation() {
  const payload = buildReservationPayload()

  if (!payload) {
    return
  }

  isSaving.value = true
  formError.value = ''

  try {
    if (editingReservation.value) {
      await updateReservation(tenantId.value, editingReservation.value.id, payload, session.value?.accessToken)
    } else {
      await createReservation(tenantId.value, payload, session.value?.accessToken)
    }

    isReservationOpen.value = false
    await loadData()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Could not save reservation'
  } finally {
    isSaving.value = false
  }
}

function openCancel(reservation: Reservation) {
  cancelingReservation.value = reservation
  cancelForm.reason = ''
  isCancelOpen.value = true
}

async function submitCancel() {
  if (!cancelingReservation.value) {
    return
  }

  isSaving.value = true
  formError.value = ''

  try {
    await cancelReservation(
      tenantId.value,
      cancelingReservation.value.id,
      { reason: cancelForm.reason.trim() || undefined },
      session.value?.accessToken,
    )
    isCancelOpen.value = false
    await loadData()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Could not cancel reservation'
  } finally {
    isSaving.value = false
  }
}

function openArrival(reservation: Reservation) {
  arrivingReservation.value = reservation
  isArrivalOpen.value = true
}

async function submitArrival() {
  if (!arrivingReservation.value) {
    return
  }

  isSaving.value = true
  formError.value = ''

  try {
    await confirmReservationArrival(
      tenantId.value,
      arrivingReservation.value.id,
      session.value?.accessToken,
    )
    isArrivalOpen.value = false
    await loadData()
    await router.push({ name: 'tenant-sessions', params: { tenantSlug: tenantId.value } })
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Could not confirm arrival'
  } finally {
    isSaving.value = false
  }
}

async function saveSettings() {
  isSaving.value = true
  errorMessage.value = ''

  try {
    await updateReservationSettings(
      tenantId.value,
      {
        timezone: settingsForm.timezone,
        slotMinutes: Number(settingsForm.slotMinutes),
        weeklyHours: normalizeWeeklyHours(settingsForm.weeklyHours),
      },
      session.value?.accessToken,
    )
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not save settings'
  } finally {
    isSaving.value = false
  }
}

function shiftWeek(days: number) {
  const next = new Date(`${weekStart.value}T00:00:00`)
  next.setDate(next.getDate() + days)
  weekStart.value = formatLocalDate(startOfWeek(next))
}

watch(tenantId, () => {
  void loadData()
})

watch(weekStart, () => {
  void loadData()
})

watch(() => reservationForm.selectedDate, () => {
  if (!reservationForm.startsAt) {
    return
  }

  const selectedSlotStillVisible = availableStartSlots.value.some(slot => slot.startsAt === reservationForm.startsAt)

  if (!selectedSlotStillVisible) {
    reservationForm.startsAt = ''
  }
})

onMounted(() => {
  settingsForm.weeklyHours = defaultWeeklyHours()
  void loadData()
})
</script>

<template>
  <section class="grid min-h-0 gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          Reservations
        </h1>
        <p class="text-sm text-muted-foreground">
          Schedule private rooms and public seats, then start sessions when customers arrive.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button
          variant="outline"
          :disabled="isLoading"
          @click="loadData"
        >
          <RotateCcw class="h-4 w-4" />
          Reload
        </Button>
        <Button @click="openCreateReservation">
          <Plus class="h-4 w-4" />
          New Reservation
        </Button>
      </div>
    </div>

    <Alert
      v-if="errorMessage"
      variant="destructive"
    >
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>Reservations error</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <Tabs default-value="timetable">
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="timetable">
          Timetable
        </TabsTrigger>
        <TabsTrigger value="reservations">
          Reservations
        </TabsTrigger>
        <TabsTrigger value="settings">
          Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="timetable"
        class="grid gap-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex gap-2">
            <Button
              variant="outline"
              @click="shiftWeek(-7)"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              @click="weekStart = formatLocalDate(startOfWeek(new Date()))"
            >
              Current
            </Button>
            <Button
              variant="outline"
              @click="shiftWeek(7)"
            >
              Next
            </Button>
          </div>
          <Badge variant="secondary">
            Week of {{ weekStart }}
          </Badge>
        </div>

        <div class="max-h-[calc(100vh-260px)] overflow-auto rounded-md border">
          <div class="grid min-w-[980px] grid-cols-7">
            <div
              v-for="date in weekDates"
              :key="date.toISOString()"
              class="border-r p-3 last:border-r-0"
            >
              <div class="mb-3 font-medium">
                {{ dayNames[date.getDay()] }} {{ formatLocalDate(date).slice(5, 10) }}
              </div>
              <div class="grid gap-2">
                <div
                  v-for="slot in slotsByDate.get(formatLocalDate(date)) || []"
                  :key="slot.startsAt"
                  class="grid gap-2 rounded-md border bg-background p-2 text-xs"
                >
                  <div class="font-medium">
                    {{ slot.label }}
                  </div>
                  <div
                    v-if="slot.reservations.length === 0"
                    class="text-muted-foreground"
                  >
                    Available
                  </div>
                  <div
                    v-for="reservation in slot.reservations"
                    :key="reservation.id"
                    class="min-w-0 rounded border bg-muted/40 p-2"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <span class="min-w-0 truncate font-medium">{{ customerName(reservation.customer) }}</span>
                      <Badge :variant="reservation.status === 'scheduled' ? 'default' : 'secondary'">
                        {{ reservation.status }}
                      </Badge>
                    </div>
                    <div class="truncate text-muted-foreground">
                      {{ formatResourceSummary(reservation) }}
                    </div>
                  </div>
                </div>
                <div
                  v-if="!(slotsByDate.get(formatLocalDate(date)) || []).length"
                  class="rounded-md border p-3 text-xs text-muted-foreground"
                >
                  Closed
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent
        value="reservations"
        class="grid gap-4"
      >
        <div class="overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Resources</TableHead>
                <TableHead>Status</TableHead>
                <TableHead class="w-48 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="isLoading">
                <TableCell colspan="5">
                  Loading reservations...
                </TableCell>
              </TableRow>
              <template v-else>
                <TableRow
                  v-for="reservation in reservations"
                  :key="reservation.id"
                >
                  <TableCell class="max-w-[180px] truncate font-medium">
                    {{ customerName(reservation.customer) }}
                  </TableCell>
                  <TableCell class="min-w-[220px]">
                    {{ formatDateTime(reservation.startsAt) }} - {{ formatDateTime(reservation.endsAt) }}
                  </TableCell>
                  <TableCell class="max-w-[260px] truncate">
                    {{ formatResourceSummary(reservation) }}
                  </TableCell>
                  <TableCell>
                    <Badge :variant="reservation.status === 'scheduled' ? 'default' : 'secondary'">
                      {{ reservation.status }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div class="flex justify-end gap-2">
                      <Button
                        v-if="reservation.status === 'scheduled'"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Confirm arrival"
                        @click="openArrival(reservation)"
                      >
                        <CheckCircle2 class="h-4 w-4" />
                      </Button>
                      <Button
                        v-if="reservation.status === 'scheduled'"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Edit reservation"
                        @click="openEditReservation(reservation)"
                      >
                        <Pencil class="h-4 w-4" />
                      </Button>
                      <Button
                        v-if="reservation.status === 'scheduled'"
                        variant="destructive"
                        size="icon-sm"
                        aria-label="Cancel reservation"
                        @click="openCancel(reservation)"
                      >
                        <XCircle class="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </template>
              <TableRow v-if="!isLoading && reservations.length === 0">
                <TableCell colspan="5">
                  No reservations for this week.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent
        value="settings"
        class="grid gap-4"
      >
        <div class="grid gap-4 rounded-md border p-4">
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="grid gap-2">
              <Label>Timezone</Label>
              <Input v-model="settingsForm.timezone" />
            </div>
            <div class="grid gap-2">
              <Label>Slot minutes</Label>
              <select
                v-model.number="settingsForm.slotMinutes"
                class="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option
                  v-for="slot in slotOptions"
                  :key="slot"
                  :value="slot"
                >
                  {{ slot }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid gap-2">
            <div
              v-for="day in settingsForm.weeklyHours"
              :key="day.dayOfWeek"
              class="grid gap-3 rounded-md border p-3 sm:grid-cols-[120px_1fr_1fr_1fr]"
            >
              <label class="flex items-center gap-2 text-sm font-medium">
                <input
                  v-model="day.enabled"
                  type="checkbox"
                >
                {{ dayNames[day.dayOfWeek] }}
              </label>
              <Input
                v-model="day.opensAt"
                type="time"
                :disabled="!day.enabled"
              />
              <Input
                v-model="day.closesAt"
                type="time"
                :disabled="!day.enabled"
              />
              <Badge :variant="day.enabled ? 'default' : 'secondary'">
                {{ day.enabled ? 'Open' : 'Closed' }}
              </Badge>
            </div>
          </div>

          <div class="flex justify-end">
            <Button
              :disabled="isSaving"
              @click="saveSettings"
            >
              <Save class="h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>

    <Dialog v-model:open="isReservationOpen">
      <DialogContent class="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{{ editingReservation ? 'Edit Reservation' : 'Create Reservation' }}</DialogTitle>
          <DialogDescription>
            Reserve private rooms and public seats for a future customer visit.
          </DialogDescription>
        </DialogHeader>

        <form
          class="grid gap-4"
          @submit.prevent="saveReservation"
        >
          <Alert
            v-if="formError"
            variant="destructive"
          >
            <AlertCircle class="h-4 w-4" />
            <AlertTitle>Reservation error</AlertTitle>
            <AlertDescription>{{ formError }}</AlertDescription>
          </Alert>

          <div class="grid gap-3">
            <Label>Customer</Label>
            <div class="flex gap-2">
              <Button
                type="button"
                :variant="reservationForm.customerMode === 'existing' ? 'secondary' : 'outline'"
                :disabled="Boolean(editingReservation)"
                @click="reservationForm.customerMode = 'existing'"
              >
                Existing
              </Button>
              <Button
                type="button"
                :variant="reservationForm.customerMode === 'new' ? 'secondary' : 'outline'"
                :disabled="Boolean(editingReservation)"
                @click="reservationForm.customerMode = 'new'"
              >
                Quick-create
              </Button>
            </div>
            <select
              v-if="reservationForm.customerMode === 'existing'"
              v-model="reservationForm.customerId"
              class="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option
                v-for="customer in customers"
                :key="customer._id"
                :value="customer._id"
              >
                {{ customer.firstName }} {{ customer.lastName }} - {{ customer.phoneNumber }}
              </option>
            </select>
            <div
              v-else
              class="grid gap-3 sm:grid-cols-2"
            >
              <Input
                v-model="reservationForm.firstName"
                placeholder="First name"
              />
              <Input
                v-model="reservationForm.lastName"
                placeholder="Last name"
              />
              <Input
                v-model="reservationForm.phoneNumber"
                placeholder="Phone"
              />
              <Input
                v-model="reservationForm.email"
                placeholder="Email"
              />
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <div class="grid gap-2">
              <Label>Date</Label>
              <select
                v-model="reservationForm.selectedDate"
                class="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">
                  Select a date
                </option>
                <option
                  v-for="dateOption in availableDateOptions"
                  :key="dateOption.value"
                  :value="dateOption.value"
                >
                  {{ dateOption.label }}
                </option>
              </select>
            </div>
            <div class="grid gap-2">
              <Label>Time slot</Label>
              <select
                v-model="reservationForm.startsAt"
                class="h-10 rounded-md border bg-background px-3 text-sm"
                :disabled="!reservationForm.selectedDate"
              >
                <option value="">
                  Select an allowed time
                </option>
                <option
                  v-for="slot in availableStartSlots"
                  :key="slot.startsAt"
                  :value="slot.startsAt"
                >
                  {{ slot.label }}
                </option>
              </select>
            </div>
            <div class="grid gap-2">
              <Label>Duration minutes</Label>
              <select
                v-model.number="reservationForm.durationMinutes"
                class="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option
                  v-for="duration in durationOptions"
                  :key="duration"
                  :value="duration"
                >
                  {{ duration }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="grid gap-2">
              <Label>Private rooms</Label>
              <label
                v-for="room in privateRooms"
                :key="room.id"
                class="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <span>{{ room.name }}</span>
                <input
                  v-model="reservationForm.privateRooms[room.id]"
                  type="checkbox"
                >
              </label>
            </div>
            <div class="grid gap-2">
              <Label>Public seats</Label>
              <div
                v-for="room in publicRooms"
                :key="room.id"
                class="grid gap-2 rounded-md border p-3 text-sm"
              >
                <div class="flex items-center justify-between">
                  <span>{{ room.name }}</span>
                  <Badge variant="secondary">
                    {{ room.totalSeats }} seats
                  </Badge>
                </div>
                <Input
                  v-model.number="reservationForm.publicSeats[room.id]"
                  type="number"
                  min="0"
                  :max="room.totalSeats"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              @click="isReservationOpen = false"
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

    <Dialog v-model:open="isCancelOpen">
      <DialogContent class="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cancel Reservation</DialogTitle>
          <DialogDescription>
            Store this reservation as canceled and free its time slot.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-3">
          <Label>Reason</Label>
          <Input v-model="cancelForm.reason" />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            @click="isCancelOpen = false"
          >
            Keep
          </Button>
          <Button
            variant="destructive"
            :disabled="isSaving"
            @click="submitCancel"
          >
            Cancel Reservation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isArrivalOpen">
      <DialogContent class="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Arrival</DialogTitle>
          <DialogDescription>
            This starts a live session timer now for {{ arrivingReservation ? customerName(arrivingReservation.customer) : 'this customer' }}.
          </DialogDescription>
        </DialogHeader>
        <Alert
          v-if="formError"
          variant="destructive"
        >
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>Arrival error</AlertTitle>
          <AlertDescription>{{ formError }}</AlertDescription>
        </Alert>
        <DialogFooter>
          <Button
            variant="outline"
            @click="isArrivalOpen = false"
          >
            Not Yet
          </Button>
          <Button
            :disabled="isSaving"
            @click="submitArrival"
          >
            <CalendarCheck class="h-4 w-4" />
            Start Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>
