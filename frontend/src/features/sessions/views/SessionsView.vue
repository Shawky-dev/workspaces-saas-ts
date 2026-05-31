<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  AlertCircle,
  Clock3,
  DoorOpen,
  Minus,
  Plus,
  ReceiptText,
  RotateCcw,
  Save,
  ShoppingCart,
  Users,
} from 'lucide-vue-next'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  closeSession,
  getSessionAvailability,
  listActiveSessions,
  listCatalogItems,
  listCustomers,
  startSession,
  updateSessionProducts,
} from '@/shared/api/resources'
import type {
  CatalogItem,
  CloseSessionPayload,
  Customer,
  PaymentMethod,
  PaymentStatus,
  RoomAvailability,
  Session,
  StartSessionPayload,
} from '@/shared/types/api'

const route = useRoute()
const { session } = useAuth()

const routeTenantSlug = computed(() => {
  const value = route.params.tenantSlug
  return Array.isArray(value) ? value[0] : value
})
const tenantId = computed(() => routeTenantSlug.value || session.value?.tenantId || '')

const activeSessions = ref<Session[]>([])
const availability = ref<RoomAvailability[]>([])
const customers = ref<Customer[]>([])
const catalogItems = ref<CatalogItem[]>([])
const selectedSession = ref<Session | null>(null)
const closingSession = ref<Session | null>(null)
const productQuantities = ref<Record<string, number>>({})
const isLoading = ref(false)
const isSaving = ref(false)
const isStartOpen = ref(false)
const isSessionOpen = ref(false)
const isCloseOpen = ref(false)
const errorMessage = ref('')
const formError = ref('')
const now = ref(Date.now())
let timer: number | undefined

const startForm = reactive({
  customerMode: 'existing',
  customerId: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  email: '',
  privateRooms: {} as Record<string, boolean>,
  publicSeats: {} as Record<string, number>,
})

const closeForm = reactive({
  discount: '0',
  paymentStatus: 'paid' as PaymentStatus,
  paymentMethod: 'cash' as PaymentMethod,
})

const privateRooms = computed(() => availability.value.filter(room => room.type === 'private'))
const publicRooms = computed(() => availability.value.filter(room => room.type === 'public'))
const hasAvailableResources = computed(() => availability.value.some(room => room.availableSeats > 0))

function customerName(customer: Session['customer']) {
  return `${customer.firstName} ${customer.lastName}`.trim()
}

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(value || 0)
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

function elapsedMinutes(startedAt: string) {
  return Math.max(0, Math.floor((now.value - new Date(startedAt).getTime()) / 60000))
}

function billableMinutes(startedAt: string) {
  const elapsed = elapsedMinutes(startedAt)
  return Math.max(15, Math.floor(elapsed / 15) * 15)
}

function sessionRoomSubtotal(currentSession: Session) {
  const hours = billableMinutes(currentSession.startedAt) / 60
  return currentSession.roomBookings.reduce(
    (total, booking) => total + booking.ratePerHour * booking.seatCount * hours,
    0,
  )
}

function sessionProductSubtotal(currentSession: Session) {
  return currentSession.productLines.reduce(
    (total, line) => total + line.unitPrice * line.quantity,
    0,
  )
}

function sessionEstimatedTotal(currentSession: Session, discount = 0) {
  return Math.max(0, sessionRoomSubtotal(currentSession) + sessionProductSubtotal(currentSession) - discount)
}

function resetStartForm() {
  startForm.customerMode = 'existing'
  startForm.customerId = customers.value[0]?._id || ''
  startForm.firstName = ''
  startForm.lastName = ''
  startForm.phoneNumber = ''
  startForm.email = ''
  startForm.privateRooms = {}
  startForm.publicSeats = {}
  formError.value = ''
}

function openStart() {
  resetStartForm()
  isStartOpen.value = true
}

function openSessionDetails(currentSession: Session) {
  selectedSession.value = currentSession
  productQuantities.value = Object.fromEntries(
    currentSession.productLines.map(line => [line.catalogItemId, line.quantity]),
  )
  isSessionOpen.value = true
}

function openClose(currentSession: Session) {
  closingSession.value = currentSession
  closeForm.discount = '0'
  closeForm.paymentStatus = 'paid'
  closeForm.paymentMethod = 'cash'
  isCloseOpen.value = true
}

async function loadData() {
  if (!tenantId.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const [sessions, nextAvailability, nextCustomers, items] = await Promise.all([
      listActiveSessions(tenantId.value, session.value?.accessToken),
      getSessionAvailability(tenantId.value, session.value?.accessToken),
      listCustomers(tenantId.value, session.value?.accessToken),
      listCatalogItems(tenantId.value, session.value?.accessToken),
    ])

    activeSessions.value = sessions
    availability.value = nextAvailability
    customers.value = nextCustomers
    catalogItems.value = items

    if (!startForm.customerId && nextCustomers.length > 0) {
      startForm.customerId = nextCustomers[0]._id
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not load sessions'
  } finally {
    isLoading.value = false
  }
}

function selectedRoomBookings() {
  const bookings: StartSessionPayload['roomBookings'] = []

  for (const room of privateRooms.value) {
    if (startForm.privateRooms[room.id]) {
      bookings.push({ roomId: room.id, seatCount: 1 })
    }
  }

  for (const room of publicRooms.value) {
    const seatCount = Number(startForm.publicSeats[room.id] || 0)

    if (seatCount > 0) {
      bookings.push({ roomId: room.id, seatCount })
    }
  }

  return bookings
}

async function submitStartSession() {
  const roomBookings = selectedRoomBookings()

  if (roomBookings.length === 0) {
    formError.value = 'Select at least one room or public seat.'
    return
  }

  const payload: StartSessionPayload = {
    roomBookings,
  }

  if (startForm.customerMode === 'existing') {
    if (!startForm.customerId) {
      formError.value = 'Select a customer.'
      return
    }

    payload.customerId = startForm.customerId
  } else {
    if (!startForm.firstName.trim() || !startForm.lastName.trim() || !startForm.phoneNumber.trim()) {
      formError.value = 'Enter first name, last name, and phone number.'
      return
    }

    payload.customer = {
      firstName: startForm.firstName.trim(),
      lastName: startForm.lastName.trim(),
      phoneNumber: startForm.phoneNumber.trim(),
      email: startForm.email.trim() || undefined,
    }
  }

  isSaving.value = true
  formError.value = ''

  try {
    await startSession(tenantId.value, payload, session.value?.accessToken)
    isStartOpen.value = false
    await loadData()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Could not start session'
  } finally {
    isSaving.value = false
  }
}

function setProductQuantity(item: CatalogItem, nextQuantity: number) {
  productQuantities.value = {
    ...productQuantities.value,
    [item.id]: Math.max(0, Math.floor(nextQuantity || 0)),
  }
}

async function saveProducts() {
  if (!selectedSession.value) {
    return
  }

  isSaving.value = true
  formError.value = ''

  const products = Object.entries(productQuantities.value)
    .filter(([, quantity]) => quantity > 0)
    .map(([catalogItemId, quantity]) => ({
      catalogItemId,
      quantity,
    }))

  try {
    const updated = await updateSessionProducts(
      tenantId.value,
      selectedSession.value.id,
      { products },
      session.value?.accessToken,
    )
    selectedSession.value = updated
    await loadData()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Could not save products'
  } finally {
    isSaving.value = false
  }
}

async function submitCloseSession() {
  if (!closingSession.value) {
    return
  }

  isSaving.value = true
  formError.value = ''

  const payload: CloseSessionPayload = {
    discount: Number(closeForm.discount || 0),
    paymentStatus: closeForm.paymentStatus,
    paymentMethod: closeForm.paymentMethod,
  }

  try {
    await closeSession(
      tenantId.value,
      closingSession.value.id,
      payload,
      session.value?.accessToken,
    )
    isCloseOpen.value = false
    closingSession.value = null
    await loadData()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Could not close session'
  } finally {
    isSaving.value = false
  }
}

watch(tenantId, () => {
  void loadData()
})

onMounted(() => {
  void loadData()
  timer = window.setInterval(() => {
    now.value = Date.now()
  }, 30000)
})

onBeforeUnmount(() => {
  if (timer) {
    window.clearInterval(timer)
  }
})
</script>

<template>
  <section class="grid gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          Sessions
        </h1>
        <p class="text-sm text-muted-foreground">
          Start visits, assign rooms and seats, add products, and close receipts.
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
        <Button
          :disabled="!hasAvailableResources"
          @click="openStart"
        >
          <Plus class="h-4 w-4" />
          Start Session
        </Button>
      </div>
    </div>

    <Alert
      v-if="errorMessage"
      variant="destructive"
    >
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>Sessions error</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <div class="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div class="grid gap-4">
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Card
            v-for="currentSession in activeSessions"
            :key="currentSession.id"
          >
            <CardHeader>
              <div class="flex items-start justify-between gap-3">
                <div>
                  <CardTitle class="text-base">
                    {{ customerName(currentSession.customer) }}
                  </CardTitle>
                  <CardDescription>
                    {{ currentSession.customer.phoneNumber }}
                  </CardDescription>
                </div>
                <Badge>
                  <Clock3 class="h-3 w-3" />
                  {{ formatMinutes(elapsedMinutes(currentSession.startedAt)) }}
                </Badge>
              </div>
            </CardHeader>
            <CardContent class="grid gap-4">
              <div class="grid gap-2 text-sm">
                <div
                  v-for="booking in currentSession.roomBookings"
                  :key="booking.roomId"
                  class="flex items-center justify-between gap-3"
                >
                  <span>{{ booking.roomName }}</span>
                  <Badge variant="secondary">
                    {{ booking.type === 'public' ? `${booking.seatCount} seats` : 'private' }}
                  </Badge>
                </div>
              </div>
              <div class="grid gap-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Billable</span>
                  <span>{{ formatMinutes(billableMinutes(currentSession.startedAt)) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Estimated total</span>
                  <span class="font-medium">{{ formatMoney(sessionEstimatedTotal(currentSession)) }}</span>
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  @click="openSessionDetails(currentSession)"
                >
                  <ShoppingCart class="h-4 w-4" />
                  Products
                </Button>
                <Button @click="openClose(currentSession)">
                  <ReceiptText class="h-4 w-4" />
                  Checkout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          v-if="!isLoading && activeSessions.length === 0"
          class="rounded-md border p-6 text-sm text-muted-foreground"
        >
          No active sessions yet.
        </div>
      </div>

      <div class="grid content-start gap-4">
        <Card>
          <CardHeader>
            <CardTitle class="text-base">
              Private Rooms
            </CardTitle>
            <CardDescription>
              Available rooms can be booked once.
            </CardDescription>
          </CardHeader>
          <CardContent class="grid gap-2">
            <div
              v-for="room in privateRooms"
              :key="room.id"
              class="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
            >
              <span>{{ room.name }}</span>
              <Badge :variant="room.isAvailable ? 'default' : 'secondary'">
                {{ room.isAvailable ? 'Available' : 'Occupied' }}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-base">
              Public Seats
            </CardTitle>
            <CardDescription>
              Seats stay available until capacity is reached.
            </CardDescription>
          </CardHeader>
          <CardContent class="grid gap-2">
            <div
              v-for="room in publicRooms"
              :key="room.id"
              class="grid gap-1 rounded-md border p-3 text-sm"
            >
              <div class="flex items-center justify-between gap-3">
                <span>{{ room.name }}</span>
                <Badge :variant="room.availableSeats > 0 ? 'default' : 'secondary'">
                  {{ room.availableSeats }} / {{ room.totalSeats }}
                </Badge>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ formatMoney(room.ratePerHour) }} per seat/hour
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <Dialog v-model:open="isStartOpen">
      <DialogContent class="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Start Session</DialogTitle>
          <DialogDescription>
            Select a customer and book one or more rooms or public seats.
          </DialogDescription>
        </DialogHeader>

        <form
          class="grid gap-5"
          @submit.prevent="submitStartSession"
        >
          <Alert
            v-if="formError"
            variant="destructive"
          >
            <AlertCircle class="h-4 w-4" />
            <AlertTitle>Could not start session</AlertTitle>
            <AlertDescription>{{ formError }}</AlertDescription>
          </Alert>

          <div class="grid gap-3">
            <Label>Customer</Label>
            <div class="flex flex-wrap gap-2">
              <Button
                type="button"
                :variant="startForm.customerMode === 'existing' ? 'secondary' : 'outline'"
                @click="startForm.customerMode = 'existing'"
              >
                Existing
              </Button>
              <Button
                type="button"
                :variant="startForm.customerMode === 'new' ? 'secondary' : 'outline'"
                @click="startForm.customerMode = 'new'"
              >
                Quick-create
              </Button>
            </div>

            <select
              v-if="startForm.customerMode === 'existing'"
              v-model="startForm.customerId"
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
                v-model="startForm.firstName"
                placeholder="First name"
              />
              <Input
                v-model="startForm.lastName"
                placeholder="Last name"
              />
              <Input
                v-model="startForm.phoneNumber"
                placeholder="Phone number"
              />
              <Input
                v-model="startForm.email"
                type="email"
                placeholder="Email"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="grid gap-3">
              <Label>Private rooms</Label>
              <label
                v-for="room in privateRooms"
                :key="room.id"
                class="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
                :class="room.isAvailable ? '' : 'opacity-50'"
              >
                <span>{{ room.name }} - {{ formatMoney(room.ratePerHour) }}/hour</span>
                <input
                  v-model="startForm.privateRooms[room.id]"
                  type="checkbox"
                  :disabled="!room.isAvailable"
                >
              </label>
            </div>

            <div class="grid gap-3">
              <Label>Public seats</Label>
              <div
                v-for="room in publicRooms"
                :key="room.id"
                class="grid gap-2 rounded-md border p-3 text-sm"
              >
                <div class="flex items-center justify-between gap-3">
                  <span>{{ room.name }}</span>
                  <Badge variant="secondary">
                    {{ room.availableSeats }} available
                  </Badge>
                </div>
                <Input
                  v-model.number="startForm.publicSeats[room.id]"
                  type="number"
                  min="0"
                  :max="room.availableSeats"
                  :disabled="room.availableSeats === 0"
                  placeholder="Seats"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              @click="isStartOpen = false"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              :disabled="isSaving"
            >
              Start
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isSessionOpen">
      <DialogContent class="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Session Products</DialogTitle>
          <DialogDescription>
            Products are added to the bill now and deducted from inventory when the session closes.
          </DialogDescription>
        </DialogHeader>

        <Alert
          v-if="formError"
          variant="destructive"
        >
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>Could not save products</AlertTitle>
          <AlertDescription>{{ formError }}</AlertDescription>
        </Alert>

        <div class="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead class="w-44">
                  Quantity
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="item in catalogItems"
                :key="item.id"
              >
                <TableCell class="font-medium">
                  {{ item.name }}
                </TableCell>
                <TableCell>{{ item.quantityOnHand }}</TableCell>
                <TableCell>{{ formatMoney(item.soldPrice) }}</TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      @click="setProductQuantity(item, (productQuantities[item.id] || 0) - 1)"
                    >
                      <Minus class="h-4 w-4" />
                    </Button>
                    <Input
                      :model-value="productQuantities[item.id] || 0"
                      type="number"
                      min="0"
                      class="w-20"
                      @update:model-value="setProductQuantity(item, Number($event))"
                    />
                    <Button
                      variant="outline"
                      size="icon-sm"
                      @click="setProductQuantity(item, (productQuantities[item.id] || 0) + 1)"
                    >
                      <Plus class="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            @click="isSessionOpen = false"
          >
            Cancel
          </Button>
          <Button
            :disabled="isSaving"
            @click="saveProducts"
          >
            <Save class="h-4 w-4" />
            Save Products
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isCloseOpen">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Close Session</DialogTitle>
          <DialogDescription>
            Review the bill, choose payment details, and create a locked receipt.
          </DialogDescription>
        </DialogHeader>

        <form
          v-if="closingSession"
          class="grid gap-4"
          @submit.prevent="submitCloseSession"
        >
          <Alert
            v-if="formError"
            variant="destructive"
          >
            <AlertCircle class="h-4 w-4" />
            <AlertTitle>Could not close session</AlertTitle>
            <AlertDescription>{{ formError }}</AlertDescription>
          </Alert>

          <div class="grid gap-2 rounded-md border p-4 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Customer</span>
              <span>{{ customerName(closingSession.customer) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Billable time</span>
              <span>{{ formatMinutes(billableMinutes(closingSession.startedAt)) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Rooms</span>
              <span>{{ formatMoney(sessionRoomSubtotal(closingSession)) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Products</span>
              <span>{{ formatMoney(sessionProductSubtotal(closingSession)) }}</span>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <div class="grid gap-2">
              <Label>Discount</Label>
              <Input
                v-model="closeForm.discount"
                type="number"
                min="0"
                step="0.01"
              />
            </div>
            <div class="grid gap-2">
              <Label>Payment status</Label>
              <select
                v-model="closeForm.paymentStatus"
                class="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <div class="grid gap-2">
              <Label>Payment method</Label>
              <select
                v-model="closeForm.paymentMethod"
                class="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="wallet">Wallet</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="mixed">Mixed</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div class="flex items-center justify-between rounded-md border bg-muted/40 p-4">
            <span class="text-sm text-muted-foreground">Final total</span>
            <span class="text-xl font-semibold">
              {{ formatMoney(sessionEstimatedTotal(closingSession, Number(closeForm.discount || 0))) }}
            </span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              @click="isCloseOpen = false"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              :disabled="isSaving"
            >
              Close Session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </section>
</template>
