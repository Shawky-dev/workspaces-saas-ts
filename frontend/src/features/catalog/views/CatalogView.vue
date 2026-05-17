<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { AlertCircle, ImageIcon, PackagePlus, Pencil, Plus, Trash2 } from 'lucide-vue-next'
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
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/features/auth/composables/useAuth'
import {
  createCatalogItem,
  deleteCatalogItem,
  getCatalogItemImageBlob,
  listCatalogItems,
  updateCatalogItem,
} from '@/shared/api/resources'
import type { CatalogItem } from '@/shared/types/api'

const route = useRoute()
const { session } = useAuth()

const routeTenantSlug = computed(() => {
  const value = route.params.tenantSlug
  return Array.isArray(value) ? value[0] : value
})
const tenantId = computed(() => routeTenantSlug.value || session.value?.tenantId || '')

const items = ref<CatalogItem[]>([])
const thumbnails = ref<Record<string, string>>({})
const editingItem = ref<CatalogItem | null>(null)
const deletingItem = ref<CatalogItem | null>(null)
const selectedImage = ref<File | null>(null)
const selectedImagePreview = ref('')
const fileInputKey = ref(0)
const isLoading = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const isDialogOpen = ref(false)
const isDeleteOpen = ref(false)
const errorMessage = ref('')
const formError = ref('')

const form = reactive({
  name: '',
  purchasePrice: '',
  soldPrice: '',
  description: '',
})

const dialogImageUrl = computed(() => {
  if (selectedImagePreview.value) {
    return selectedImagePreview.value
  }

  if (editingItem.value?.hasImage) {
    return thumbnails.value[editingItem.value.id] || ''
  }

  return ''
})

function formatPrice(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function revokeThumbnails() {
  Object.values(thumbnails.value).forEach((url) => URL.revokeObjectURL(url))
  thumbnails.value = {}
}

function clearSelectedImagePreview() {
  if (selectedImagePreview.value) {
    URL.revokeObjectURL(selectedImagePreview.value)
  }

  selectedImagePreview.value = ''
}

function resetForm() {
  editingItem.value = null
  selectedImage.value = null
  clearSelectedImagePreview()
  fileInputKey.value += 1
  form.name = ''
  form.purchasePrice = ''
  form.soldPrice = ''
  form.description = ''
  formError.value = ''
}

async function loadThumbnails(nextItems: CatalogItem[]) {
  revokeThumbnails()
  const nextThumbnails: Record<string, string> = {}

  await Promise.all(
    nextItems
      .filter((item) => item.hasImage)
      .map(async (item) => {
        try {
          const blob = await getCatalogItemImageBlob(
            tenantId.value,
            item.id,
            session.value?.accessToken,
          )
          nextThumbnails[item.id] = URL.createObjectURL(blob)
        } catch {
          nextThumbnails[item.id] = ''
        }
      }),
  )

  thumbnails.value = nextThumbnails
}

async function loadItems() {
  if (!tenantId.value) {
    errorMessage.value = 'Tenant is required.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const nextItems = await listCatalogItems(tenantId.value, session.value?.accessToken)
    items.value = nextItems
    await loadThumbnails(nextItems)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not load catalog items'
  } finally {
    isLoading.value = false
  }
}

function openCreate() {
  resetForm()
  isDialogOpen.value = true
}

function openEdit(item: CatalogItem) {
  resetForm()
  editingItem.value = item
  form.name = item.name
  form.purchasePrice = String(item.purchasePrice)
  form.soldPrice = String(item.soldPrice)
  form.description = item.description || ''
  isDialogOpen.value = true
}

function handleImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  selectedImage.value = file
  clearSelectedImagePreview()

  if (file) {
    selectedImagePreview.value = URL.createObjectURL(file)
  }
}

function validateForm() {
  const purchasePrice = Number(form.purchasePrice)
  const soldPrice = Number(form.soldPrice)

  if (!form.name.trim()) {
    return 'Name is required.'
  }

  if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
    return 'Purchase price must be a non-negative number.'
  }

  if (!Number.isFinite(soldPrice) || soldPrice < 0) {
    return 'Sold price must be a non-negative number.'
  }

  return ''
}

async function saveItem() {
  const validationError = validateForm()

  if (validationError) {
    formError.value = validationError
    return
  }

  isSaving.value = true
  formError.value = ''
  errorMessage.value = ''

  const payload = {
    name: form.name.trim(),
    purchasePrice: Number(form.purchasePrice),
    soldPrice: Number(form.soldPrice),
    description: form.description.trim(),
    image: selectedImage.value,
  }

  try {
    if (editingItem.value) {
      await updateCatalogItem(
        tenantId.value,
        editingItem.value.id,
        payload,
        session.value?.accessToken,
      )
    } else {
      await createCatalogItem(tenantId.value, payload, session.value?.accessToken)
    }

    isDialogOpen.value = false
    resetForm()
    await loadItems()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Could not save catalog item'
  } finally {
    isSaving.value = false
  }
}

function openDelete(item: CatalogItem) {
  deletingItem.value = item
  isDeleteOpen.value = true
}

async function confirmDelete() {
  if (!deletingItem.value) {
    return
  }

  isDeleting.value = true
  errorMessage.value = ''

  try {
    await deleteCatalogItem(tenantId.value, deletingItem.value.id, session.value?.accessToken)
    isDeleteOpen.value = false
    deletingItem.value = null
    await loadItems()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not delete catalog item'
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  void loadItems()
})

watch(tenantId, () => {
  void loadItems()
})

onBeforeUnmount(() => {
  revokeThumbnails()
  clearSelectedImagePreview()
})
</script>

<template>
  <section class="grid gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          Catalog
        </h1>
        <p class="text-sm text-muted-foreground">
          Manage the products and snacks sold inside this workspace.
        </p>
      </div>
      <Button @click="openCreate">
        <Plus class="h-4 w-4" />
        New Item
      </Button>
    </div>

    <Alert
      v-if="errorMessage"
      variant="destructive"
    >
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>Catalog error</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <div class="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-20">
              Image
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Purchase</TableHead>
            <TableHead>Sold</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead class="w-32 text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="isLoading">
            <TableCell
              colspan="7"
              class="text-muted-foreground"
            >
              Loading catalog items...
            </TableCell>
          </TableRow>
          <template v-else>
            <TableRow
              v-for="item in items"
              :key="item.id"
            >
              <TableCell>
                <div class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border bg-muted">
                  <img
                    v-if="thumbnails[item.id]"
                    :src="thumbnails[item.id]"
                    :alt="item.name"
                    class="h-full w-full object-cover"
                  >
                  <ImageIcon
                    v-else
                    class="h-4 w-4 text-muted-foreground"
                  />
                </div>
              </TableCell>
              <TableCell class="font-medium">
                {{ item.name }}
              </TableCell>
              <TableCell>{{ formatPrice(item.purchasePrice) }}</TableCell>
              <TableCell>{{ formatPrice(item.soldPrice) }}</TableCell>
              <TableCell class="max-w-64 truncate text-muted-foreground">
                {{ item.description || 'No description' }}
              </TableCell>
              <TableCell>
                <Badge :variant="item.hasImage ? 'default' : 'secondary'">
                  {{ item.hasImage ? 'Image' : 'No image' }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Edit catalog item"
                    @click="openEdit(item)"
                  >
                    <Pencil class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    aria-label="Delete catalog item"
                    @click="openDelete(item)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-if="!isLoading && items.length === 0">
            <TableCell
              colspan="7"
              class="text-muted-foreground"
            >
              No catalog items yet.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <Dialog v-model:open="isDialogOpen">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ editingItem ? 'Edit Catalog Item' : 'Create Catalog Item' }}</DialogTitle>
          <DialogDescription>
            Define the product details used by the workspace inventory catalog.
          </DialogDescription>
        </DialogHeader>

        <form
          class="grid gap-4"
          @submit.prevent="saveItem"
        >
          <Alert
            v-if="formError"
            variant="destructive"
          >
            <AlertCircle class="h-4 w-4" />
            <AlertTitle>Could not save item</AlertTitle>
            <AlertDescription>{{ formError }}</AlertDescription>
          </Alert>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="grid gap-2 md:col-span-2">
              <Label for="catalog-name">Name</Label>
              <Input
                id="catalog-name"
                v-model="form.name"
                required
              />
            </div>
            <div class="grid gap-2">
              <Label for="catalog-purchase-price">Purchase price</Label>
              <Input
                id="catalog-purchase-price"
                v-model="form.purchasePrice"
                type="number"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div class="grid gap-2">
              <Label for="catalog-sold-price">Sold price</Label>
              <Input
                id="catalog-sold-price"
                v-model="form.soldPrice"
                type="number"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div class="grid gap-2 md:col-span-2">
              <Label for="catalog-description">Description</Label>
              <Textarea
                id="catalog-description"
                v-model="form.description"
                class="min-h-24"
              />
            </div>
            <div class="grid gap-2 md:col-span-2">
              <Label for="catalog-image">Image</Label>
              <div class="grid gap-3 sm:grid-cols-[96px_1fr]">
                <div class="flex h-24 w-24 items-center justify-center overflow-hidden rounded-md border bg-muted">
                  <img
                    v-if="dialogImageUrl"
                    :src="dialogImageUrl"
                    alt="Catalog preview"
                    class="h-full w-full object-cover"
                  >
                  <PackagePlus
                    v-else
                    class="h-5 w-5 text-muted-foreground"
                  />
                </div>
                <div class="grid content-start gap-2">
                  <Input
                    :key="fileInputKey"
                    id="catalog-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    @change="handleImageChange"
                  />
                  <p class="text-xs text-muted-foreground">
                    Optional jpeg, png, webp, or gif. Leave empty while editing to keep the current image.
                  </p>
                </div>
              </div>
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

    <AlertDialog v-model:open="isDeleteOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete catalog item?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes {{ deletingItem?.name || 'this item' }} from the workspace catalog.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isDeleting">
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
