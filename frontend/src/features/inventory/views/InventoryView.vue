<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import {
  AlertCircle,
  Minus,
  PackageOpen,
  Plus,
  RotateCcw,
  Save,
} from 'lucide-vue-next'

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

type InventoryRow = CatalogItem & {
  draftQuantity: number
}

const route = useRoute()
const { session } = useAuth()

const routeTenantSlug = computed(() => {
  const value = route.params.tenantSlug

  return Array.isArray(value)
    ? value[0]
    : value
})

const tenantId = computed(
  () => routeTenantSlug.value
    || session.value?.tenantId
    || '',
)

const items = ref<InventoryRow[]>([])

const isLoading = ref(false)
const isSavingBulk = ref(false)
const adjustingItemId = ref('')

const errorMessage = ref('')
const successMessage = ref('')

const hasItems = computed(() => items.value.length > 0)

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function mapInventoryItems(data: CatalogItem[]): InventoryRow[] {
  return data.map(item => ({
    ...item,
    draftQuantity: item.quantityOnHand ?? 0,
  }))
}

async function loadInventory() {
  if (!tenantId.value) {
    errorMessage.value = 'Tenant is required.'
    return
  }

  isLoading.value = true
  clearMessages()

  try {
    const data = await listCatalogItems(
      tenantId.value,
      session.value?.accessToken,
    )

    items.value = mapInventoryItems(data)
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

async function saveAllQuantities() {
  if (!items.value.length) {
    return
  }

  isSavingBulk.value = true
  clearMessages()

  try {
    const payload = items.value.map(item => ({
      id: item.id,
      quantityOnHand: Math.max(
        0,
        Math.floor(item.draftQuantity || 0),
      ),
    }))

    const updated = await bulkUpdateCatalogQuantities(
      tenantId.value,
      payload,
      session.value?.accessToken,
    )

    items.value = mapInventoryItems(updated)

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

async function saveItemQuantity(item: InventoryRow) {
  const nextQuantity = Math.max(
    0,
    Math.floor(item.draftQuantity || 0),
  )

  const currentQuantity = item.quantityOnHand ?? 0

  const delta = nextQuantity - currentQuantity

  if (delta === 0) {
    successMessage.value = 'No changes to save.'
    return
  }

  adjustingItemId.value = item.id
  clearMessages()

  try {
    const updated = await adjustCatalogQuantity(
      tenantId.value,
      item.id,
      delta,
      session.value?.accessToken,
    )

    Object.assign(item, {
      ...updated,
      draftQuantity: updated.quantityOnHand ?? 0,
    })

    successMessage.value = `${updated.name} quantity updated.`
  }
  catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Could not update quantity'
  }
  finally {
    adjustingItemId.value = ''
  }
}

function incrementQuantity(item: InventoryRow) {
  item.draftQuantity++
}

function decrementQuantity(item: InventoryRow) {
  item.draftQuantity = Math.max(
    0,
    item.draftQuantity - 1,
  )
}

watch(
  tenantId,
  () => {
    void loadInventory()
  },
  {
    immediate: true,
  },
)
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
          @click="saveAllQuantities"
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
                  {{ item.quantityOnHand ?? 0 }}
                </Badge>
              </TableCell>

              <TableCell>
                <Input
                  v-model.number="item.draftQuantity"
                  type="number"
                  min="0"
                  step="1"
                  inputmode="numeric"
                />
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
