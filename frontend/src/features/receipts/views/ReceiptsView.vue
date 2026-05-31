<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { AlertCircle, Eye, ReceiptText, RotateCcw } from 'lucide-vue-next'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/features/auth/composables/useAuth'
import { listCustomerReceipts, listReceipts } from '@/shared/api/resources'
import type { Receipt } from '@/shared/types/api'

const route = useRoute()
const { session } = useAuth()

const routeTenantSlug = computed(() => {
  const value = route.params.tenantSlug
  return Array.isArray(value) ? value[0] : value
})
const tenantId = computed(() => routeTenantSlug.value || session.value?.tenantId || '')

const receipts = ref<Receipt[]>([])
const customerHistory = ref<Receipt[]>([])
const selectedReceipt = ref<Receipt | null>(null)
const isLoading = ref(false)
const isHistoryLoading = ref(false)
const isDialogOpen = ref(false)
const errorMessage = ref('')

function customerName(receipt: Receipt) {
  return `${receipt.customer.firstName} ${receipt.customer.lastName}`.trim()
}

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(value || 0)
}

function formatDate(value?: string) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

async function loadReceipts() {
  if (!tenantId.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    receipts.value = await listReceipts(tenantId.value, session.value?.accessToken)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not load receipts'
  } finally {
    isLoading.value = false
  }
}

async function openReceipt(receipt: Receipt) {
  selectedReceipt.value = receipt
  customerHistory.value = []
  isDialogOpen.value = true
  isHistoryLoading.value = true

  try {
    customerHistory.value = await listCustomerReceipts(
      tenantId.value,
      receipt.customer.customerId,
      session.value?.accessToken,
    )
  } catch {
    customerHistory.value = []
  } finally {
    isHistoryLoading.value = false
  }
}

watch(tenantId, () => {
  void loadReceipts()
})

onMounted(() => {
  void loadReceipts()
})
</script>

<template>
  <section class="grid gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          Receipts
        </h1>
        <p class="text-sm text-muted-foreground">
          Review closed sessions and customer payment history.
        </p>
      </div>
      <Button
        variant="outline"
        :disabled="isLoading"
        @click="loadReceipts"
      >
        <RotateCcw class="h-4 w-4" />
        Reload
      </Button>
    </div>

    <Alert
      v-if="errorMessage"
      variant="destructive"
    >
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>Receipts error</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <div class="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Closed</TableHead>
            <TableHead>Rooms</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead class="w-24 text-right">
              View
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="isLoading">
            <TableCell
              colspan="8"
              class="text-muted-foreground"
            >
              Loading receipts...
            </TableCell>
          </TableRow>
          <template v-else>
            <TableRow
              v-for="receipt in receipts"
              :key="receipt.id"
            >
              <TableCell class="font-medium">
                {{ customerName(receipt) }}
              </TableCell>
              <TableCell>{{ formatDate(receipt.closedAt) }}</TableCell>
              <TableCell>{{ formatMoney(receipt.receipt.roomSubtotal) }}</TableCell>
              <TableCell>{{ formatMoney(receipt.receipt.productsSubtotal) }}</TableCell>
              <TableCell>{{ formatMoney(receipt.receipt.discount) }}</TableCell>
              <TableCell class="font-medium">
                {{ formatMoney(receipt.receipt.total) }}
              </TableCell>
              <TableCell>
                <div class="flex flex-wrap gap-1">
                  <Badge>{{ receipt.receipt.paymentStatus }}</Badge>
                  <Badge variant="secondary">
                    {{ receipt.receipt.paymentMethod }}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div class="flex justify-end">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="View receipt"
                    @click="openReceipt(receipt)"
                  >
                    <Eye class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-if="!isLoading && receipts.length === 0">
            <TableCell
              colspan="8"
              class="text-muted-foreground"
            >
              No receipts yet.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <Dialog v-model:open="isDialogOpen">
      <DialogContent class="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
          <DialogDescription>
            Locked checkout details for this closed session.
          </DialogDescription>
        </DialogHeader>

        <div
          v-if="selectedReceipt"
          class="grid gap-5 lg:grid-cols-[1fr_280px]"
        >
          <div class="grid gap-4 rounded-md border p-4">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="flex items-center gap-2 text-lg font-semibold">
                  <ReceiptText class="h-5 w-5" />
                  Receipt
                </div>
                <p class="text-sm text-muted-foreground">
                  {{ formatDate(selectedReceipt.closedAt) }}
                </p>
              </div>
              <Badge>{{ selectedReceipt.receipt.paymentStatus }}</Badge>
            </div>

            <div class="grid gap-1 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Customer</span>
                <span>{{ customerName(selectedReceipt) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Phone</span>
                <span>{{ selectedReceipt.customer.phoneNumber }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Billable time</span>
                <span>{{ formatMinutes(selectedReceipt.receipt.billableMinutes) }}</span>
              </div>
            </div>

            <div class="grid gap-2">
              <h3 class="text-sm font-medium">
                Rooms and seats
              </h3>
              <div
                v-for="booking in selectedReceipt.receipt.roomBookings"
                :key="booking.roomId"
                class="flex justify-between rounded-md border p-2 text-sm"
              >
                <span>{{ booking.roomName }} x {{ booking.seatCount }}</span>
                <span>{{ formatMoney(booking.ratePerHour) }}/hour</span>
              </div>
            </div>

            <div class="grid gap-2">
              <h3 class="text-sm font-medium">
                Products
              </h3>
              <div
                v-if="selectedReceipt.receipt.productLines.length === 0"
                class="text-sm text-muted-foreground"
              >
                No products purchased.
              </div>
              <div
                v-for="line in selectedReceipt.receipt.productLines"
                :key="line.catalogItemId"
                class="flex justify-between rounded-md border p-2 text-sm"
              >
                <span>{{ line.name }} x {{ line.quantity }}</span>
                <span>{{ formatMoney(line.unitPrice * line.quantity) }}</span>
              </div>
            </div>

            <div class="grid gap-1 border-t pt-3 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Rooms</span>
                <span>{{ formatMoney(selectedReceipt.receipt.roomSubtotal) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Products</span>
                <span>{{ formatMoney(selectedReceipt.receipt.productsSubtotal) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Discount</span>
                <span>{{ formatMoney(selectedReceipt.receipt.discount) }}</span>
              </div>
              <div class="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{{ formatMoney(selectedReceipt.receipt.total) }}</span>
              </div>
            </div>
          </div>

          <div class="grid content-start gap-3">
            <div>
              <h3 class="text-sm font-medium">
                Customer history
              </h3>
              <p class="text-xs text-muted-foreground">
                Past closed receipts for this customer.
              </p>
            </div>
            <div
              v-if="isHistoryLoading"
              class="rounded-md border p-3 text-sm text-muted-foreground"
            >
              Loading history...
            </div>
            <template v-else>
              <div
                v-for="history in customerHistory"
                :key="history.id"
                class="rounded-md border p-3 text-sm"
              >
                <div class="flex items-center justify-between gap-3">
                  <span>{{ formatDate(history.closedAt) }}</span>
                  <span class="font-medium">{{ formatMoney(history.receipt.total) }}</span>
                </div>
                <p class="text-xs text-muted-foreground">
                  {{ history.receipt.paymentStatus }} via {{ history.receipt.paymentMethod }}
                </p>
              </div>
            </template>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </section>
</template>
