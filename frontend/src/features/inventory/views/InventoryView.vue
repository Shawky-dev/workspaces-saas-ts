<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { AlertCircle, Minus, PackageOpen, Plus, RotateCcw, Save } from 'lucide-vue-next'

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  adjustCatalogQuantity,
  bulkUpdateCatalogQuantities,
  listCatalogItems,
} from '@/shared/api/resources'

import type { CatalogItem } from '@/shared/types/api'

const route = useRoute()
const { session } = useAuth()

const routeTenantSlug = computed(() => {
  const value = route.params.tenantSlug
  return Array.isArray(value) ? value[0] : value
})

const tenantId = computed(
  () => routeTenantSlug.value || session.value?.tenantId || '',
)

const items = ref<CatalogItem[]>([])

const quantityDrafts = reactive<Record<string, string>>({})

const isLoading = ref(false)
const isSavingBulk = ref(false)
const adjustingItemId = ref('')

const errorMessage = ref('')
const successMessage = ref('')

const hasItems = computed(() => items.value.length > 0)

function syncDrafts(nextItems: CatalogItem[]) {
  Object.keys(quantityDrafts).forEach((key) => delete quantityDrafts[key])

  nextItems.forEach((item) => {
    quantityDrafts[item.id] = String(item.quantityOnHand ?? 0)
  })
}

function parseWholeNumber(value: string | number) {
  const normalized = String(value).trim()

  if (!/^\d+$/.test(normalized)) {
    return null
  }

  const parsed = Number(normalized)

  return Number.isSafeInteger(parsed)
    ? parsed
    : null
}

function rowQuantity(item: CatalogItem) {
  return item.quantityOnHand ?? 0
}

async function loadInventory() {
  if (!tenantId.value) {
    errorMessage.value = 'Tenant is required.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const nextItems = await listCatalogItems(
      tenantId.value,
      session.value?.accessToken,
    )

    items.value = nextItems

    syncDrafts(nextItems)
  }
  catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Could not load inventory'
  }
  finally {
    isLoading.value = false
  }
}

async function saveBulkQuantities() {
  const payload = items.value.map((item) => {
    const quantityOnHand = parseWholeNumber(
      quantityDrafts[item.id] ?? '',
    )

    if (quantityOnHand === null) {
      throw new Error(
        `${item.name} quantity must be a whole number of 0 or more.`,
      )
    }

    return {
      id: item.id,
      quantityOnHand,
    }
  })

  isSavingBulk.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const updatedItems = await bulkUpdateCatalogQuantities(
      tenantId.value,
      payload,
      session.value?.accessToken,
    )

    items.value = updatedItems

    syncDrafts(updatedItems)

    successMessage.value = 'Inventory quantities saved.'
  }
  catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Could not save quantities'
  }
  finally {
    isSavingBulk.value = false
  }
}

async function handleBulkSave() {
  try {
    await saveBulkQuantities()
  }
  catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Check quantity values'
  }
}

async function applyAdjustment(item: CatalogItem, delta: number) {
  if (rowQuantity(item) + delta < 0) {
    errorMessage.value = `${item.name} cannot go below zero.`
    successMessage.value = ''
    return
  }

  adjustingItemId.value = item.id

  errorMessage.value = ''
  successMessage.value = ''

  try {
    const updatedItem = await adjustCatalogQuantity(
      tenantId.value,
      item.id,
      delta,
      session.value?.accessToken,
    )

    const index = items.value.findIndex(
      currentItem => currentItem.id === item.id,
    )

    if (index >= 0) {
      items.value[index] = updatedItem
    }

    quantityDrafts[item.id] = String(
      updatedItem.quantityOnHand,
    )

    successMessage.value = `${updatedItem.name} quantity updated.`
  }
  catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Could not adjust quantity'
  }
  finally {
    adjustingItemId.value = ''
  }
}

async function saveItemQuantity(item: CatalogItem) {
  const targetQuantity = parseWholeNumber(
    quantityDrafts[item.id] ?? '',
  )

  if (targetQuantity === null) {
    errorMessage.value = 'Quantity must be a whole number of 0 or more.'
    successMessage.value = ''
    return
  }

  const delta = targetQuantity - rowQuantity(item)

  if (delta === 0) {
    successMessage.value = 'No changes to save.'
    return
  }

  void applyAdjustment(item, delta)
}

function incrementQuantity(item: CatalogItem) {
  quantityDrafts[item.id] = String(
    Number(quantityDrafts[item.id] || 0) + 1,
  )
}

function decrementQuantity(item: CatalogItem) {
  quantityDrafts[item.id] = String(
    Math.max(
      0,
      Number(quantityDrafts[item.id] || 0) - 1,
    ),
  )
}

onMounted(() => {
  void loadInventory()
})

watch(tenantId, () => {
  void loadInventory()
})
</script>

<template>
  <section class="grid gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          Inventory
        </h1>

        <p class="text-sm text-muted-foreground">
          Set stock counts in bulk and make quick item-level adjustments.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button
          variant="outline"
          :disabled="isLoading"
          @click="loadInventory"
        >
          <RotateCcw class="h-4 w-4" />
          Reload
        </Button>

        <Button
          :disabled="!hasItems || isSavingBulk"
          @click="handleBulkSave"
        >
          <Save class="h-4 w-4" />
          Save Quantities
        </Button>
      </div>
    </div>

    <Alert
      v-if="errorMessage"
      variant="destructive"
    >
      <AlertCircle class="h-4 w-4" />

      <AlertTitle>
        Inventory error
      </AlertTitle>

      <AlertDescription>
        {{ errorMessage }}
      </AlertDescription>
    </Alert>

    <Alert v-if="successMessage">
      <PackageOpen class="h-4 w-4" />

      <AlertTitle>
        Inventory updated
      </AlertTitle>

      <AlertDescription>
        {{ successMessage }}
      </AlertDescription>
    </Alert>

    <div class="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              Product
            </TableHead>

            <TableHead class="w-32">
              Current
            </TableHead>

            <TableHead class="w-44">
              Quantity
            </TableHead>

            <TableHead class="w-72">
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
              Loading inventory...
            </TableCell>
          </TableRow>

          <template v-else>
            <TableRow
              v-for="item in items"
              :key="item.id"
            >
              <TableCell>
                <div class="grid gap-1">
                  <span class="font-medium">
                    {{ item.name }}
                  </span>

                  <span class="max-w-md truncate text-xs text-muted-foreground">
                    {{ item.description || 'No description' }}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <Badge variant="secondary">
                  {{ rowQuantity(item) }}
                </Badge>
              </TableCell>

              <TableCell>
                <div class="grid gap-2">
                  <Label
                    :for="`quantity-${item.id}`"
                    class="sr-only"
                  >
                    Quantity for {{ item.name }}
                  </Label>

                  <Input
                    :id="`quantity-${item.id}`"
                    v-model="quantityDrafts[item.id]"
                    type="number"
                    min="0"
                    step="1"
                    inputmode="numeric"
                  />
                </div>
              </TableCell>

              <TableCell>
                <div class="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Decrease quantity by one"
                    :disabled="adjustingItemId === item.id"
                    @click="decrementQuantity(item)"
                  >
                    <Minus class="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Increase quantity by one"
                    :disabled="adjustingItemId === item.id"
                    @click="incrementQuantity(item)"
                  >
                    <Plus class="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    :disabled="adjustingItemId === item.id"
                    @click="saveItemQuantity(item)"
                  >
                    Apply
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </template>

          <TableRow
            v-if="!isLoading && items.length === 0"
          >
            <TableCell
              colspan="4"
              class="text-muted-foreground"
            >
              No catalog products yet.

              <Button
                as-child
                variant="link"
                class="px-1"
              >
                <RouterLink :to="`/${tenantId}/catalog`">
                  Create catalog items
                </RouterLink>
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </section>
</template>
