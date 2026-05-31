<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { AlertCircle, Eye, Pencil, Plus, ReceiptText, Trash2 } from 'lucide-vue-next'

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
import { Badge } from '@/components/ui/badge'

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
  createCustomer,
  deleteCustomer,
  listCustomerReceipts,
  listCustomers,
  updateCustomer,
} from '@/shared/api/resources'
import type { Receipt } from '@/shared/types/api'

const route = useRoute()
const { session } = useAuth()

const routeTenantSlug = computed(() => {
  const value = route.params.tenantSlug
  return Array.isArray(value) ? value[0] : value
})

const tenantId = computed(() =>
  routeTenantSlug.value || session.value?.tenantId || '',
)

const customers = ref<any[]>([])

const editingCustomer = ref<any | null>(null)
const deletingCustomer = ref<any | null>(null)
const historyCustomer = ref<any | null>(null)
const customerReceipts = ref<Receipt[]>([])

const isLoading = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const isHistoryLoading = ref(false)

const isDialogOpen = ref(false)
const isDeleteOpen = ref(false)
const isHistoryOpen = ref(false)

const errorMessage = ref('')
const formError = ref('')

const form = reactive({
  firstName: '',
  lastName: '',
  phoneNumber: '',
  email: '',
  notes: '',
})

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

async function loadCustomers() {
  if (!tenantId.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    customers.value = await listCustomers(
      tenantId.value,
      session.value?.accessToken,
    )
  }
  catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not load customers'
  }
  finally {
    isLoading.value = false
  }
}

function resetForm() {
  editingCustomer.value = null

  form.firstName = ''
  form.lastName = ''
  form.phoneNumber = ''
  form.email = ''
  form.notes = ''

  formError.value = ''
}

function openCreate() {
  resetForm()
  isDialogOpen.value = true
}

function openEdit(customer: any) {
  resetForm()

  editingCustomer.value = customer

  form.firstName = customer.firstName
  form.lastName = customer.lastName
  form.phoneNumber = customer.phoneNumber
  form.email = customer.email || ''
  form.notes = customer.notes || ''

  isDialogOpen.value = true
}

function validateForm() {
  if (!form.firstName.trim()) {
    return 'First name is required.'
  }

  if (!form.lastName.trim()) {
    return 'Last name is required.'
  }

  if (!form.phoneNumber.trim()) {
    return 'Phone number is required.'
  }

  return ''
}

async function saveCustomer() {
  const validationError = validateForm()

  if (validationError) {
    formError.value = validationError
    return
  }

  isSaving.value = true
  formError.value = ''

  const payload = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    phoneNumber: form.phoneNumber.trim(),
    email: form.email.trim(),
    notes: form.notes.trim(),
  }

  try {
    if (editingCustomer.value) {
      await updateCustomer(
        tenantId.value,
        editingCustomer.value._id,
        payload,
        session.value?.accessToken,
      )
    }
    else {
      await createCustomer(
        tenantId.value,
        payload,
        session.value?.accessToken,
      )
    }

    isDialogOpen.value = false

    resetForm()

    await loadCustomers()
  }
  catch (error) {
    formError.value =
      error instanceof Error
        ? error.message
        : 'Could not save customer'
  }
  finally {
    isSaving.value = false
  }
}

function openDelete(customer: any) {
  deletingCustomer.value = customer
  isDeleteOpen.value = true
}

async function openHistory(customer: any) {
  historyCustomer.value = customer
  customerReceipts.value = []
  isHistoryOpen.value = true
  isHistoryLoading.value = true

  try {
    customerReceipts.value = await listCustomerReceipts(
      tenantId.value,
      customer._id,
      session.value?.accessToken,
    )
  }
  catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not load customer history'
  }
  finally {
    isHistoryLoading.value = false
  }
}

async function confirmDelete() {
  if (!deletingCustomer.value) {
    return
  }

  isDeleting.value = true

  try {
    await deleteCustomer(
      tenantId.value,
      deletingCustomer.value._id,
      session.value?.accessToken,
    )

    isDeleteOpen.value = false
    deletingCustomer.value = null

    await loadCustomers()
  }
  catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not delete customer'
  }
  finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  void loadCustomers()
})

watch(tenantId, () => {
  void loadCustomers()
})
</script>

<template>
  <section class="grid gap-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          Customers
        </h1>

        <p class="text-sm text-muted-foreground">
          Manage workspace customers.
        </p>
      </div>

      <Button @click="openCreate">
        <Plus class="h-4 w-4" />
        New Customer
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
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead class="w-44 text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <TableRow v-if="isLoading">
            <TableCell colspan="6">
              Loading customers...
            </TableCell>
          </TableRow>

          <template v-else>
            <TableRow
              v-for="customer in customers"
              :key="customer._id"
            >
              <TableCell class="font-medium">
                {{ customer.firstName }}
              </TableCell>

              <TableCell>
                {{ customer.lastName }}
              </TableCell>

              <TableCell>
                {{ customer.phoneNumber }}
              </TableCell>

              <TableCell>
                {{ customer.email || '-' }}
              </TableCell>

              <TableCell>
                {{ customer.notes || '-' }}
              </TableCell>

              <TableCell>
                <div class="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="View customer history"
                    @click="openHistory(customer)"
                  >
                    <Eye class="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Edit customer"
                    @click="openEdit(customer)"
                  >
                    <Pencil class="h-4 w-4" />
                  </Button>

                  <Button
                    variant="destructive"
                    size="icon-sm"
                    aria-label="Delete customer"
                    @click="openDelete(customer)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </template>

          <TableRow
            v-if="!isLoading && customers.length === 0"
          >
            <TableCell colspan="6">
              No customers yet.
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
              editingCustomer
                ? 'Edit Customer'
                : 'Create Customer'
            }}
          </DialogTitle>

          <DialogDescription>
            Manage customer information.
          </DialogDescription>
        </DialogHeader>

        <form
          class="grid gap-4"
          @submit.prevent="saveCustomer"
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
            <Label>First Name</Label>
            <Input v-model="form.firstName" />
          </div>

          <div class="grid gap-2">
            <Label>Last Name</Label>
            <Input v-model="form.lastName" />
          </div>

          <div class="grid gap-2">
            <Label>Phone Number</Label>
            <Input v-model="form.phoneNumber" />
          </div>

          <div class="grid gap-2">
            <Label>Email</Label>
            <Input v-model="form.email" />
          </div>

          <div class="grid gap-2">
            <Label>Notes</Label>
            <Input v-model="form.notes" />
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
            Delete customer?
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

    <Dialog v-model:open="isHistoryOpen">
      <DialogContent class="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Customer History
          </DialogTitle>

          <DialogDescription>
            Past receipts for {{ historyCustomer?.firstName }} {{ historyCustomer?.lastName }}.
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4">
          <div class="rounded-md border p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="font-medium">
                  {{ historyCustomer?.firstName }} {{ historyCustomer?.lastName }}
                </div>
                <div class="text-sm text-muted-foreground">
                  {{ historyCustomer?.phoneNumber }} · {{ historyCustomer?.email || 'No email' }}
                </div>
              </div>
              <Badge variant="secondary">
                {{ customerReceipts.length }} receipts
              </Badge>
            </div>
          </div>

          <div class="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Rooms</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                <TableRow v-if="isHistoryLoading">
                  <TableCell colspan="6">
                    Loading history...
                  </TableCell>
                </TableRow>

                <template v-else>
                  <TableRow
                    v-for="receipt in customerReceipts"
                    :key="receipt.id"
                  >
                    <TableCell>{{ formatDate(receipt.closedAt) }}</TableCell>
                    <TableCell>{{ formatMoney(receipt.receipt.roomSubtotal) }}</TableCell>
                    <TableCell>
                      <div class="grid gap-1">
                        <span>{{ formatMoney(receipt.receipt.productsSubtotal) }}</span>
                        <span class="text-xs text-muted-foreground">
                          {{ receipt.receipt.productLines.length }} product lines
                        </span>
                      </div>
                    </TableCell>
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
                  </TableRow>
                </template>

                <TableRow v-if="!isHistoryLoading && customerReceipts.length === 0">
                  <TableCell
                    colspan="6"
                    class="text-muted-foreground"
                  >
                    No receipt history for this customer.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div
            v-for="receipt in customerReceipts"
            :key="`detail-${receipt.id}`"
            class="grid gap-2 rounded-md border p-4 text-sm"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2 font-medium">
                <ReceiptText class="h-4 w-4" />
                {{ formatDate(receipt.closedAt) }}
              </div>
              <span>{{ formatMoney(receipt.receipt.total) }}</span>
            </div>
            <div
              v-if="receipt.receipt.productLines.length > 0"
              class="grid gap-1 text-muted-foreground"
            >
              <div
                v-for="line in receipt.receipt.productLines"
                :key="line.catalogItemId"
                class="flex justify-between gap-3"
              >
                <span>{{ line.name }} x {{ line.quantity }}</span>
                <span>{{ formatMoney(line.unitPrice * line.quantity) }}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </section>
</template>
