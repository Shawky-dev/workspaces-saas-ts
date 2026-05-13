<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { listCommonUsers, listTenants, listTenantUsers } from '@/shared/api/resources'
import { useAuth } from '@/features/auth/composables/useAuth'

const { session } = useAuth()
const tenantCount = ref<number | null>(null)
const commonUserCount = ref<number | null>(null)
const tenantUserCount = ref<number | null>(null)
const errorMessage = ref('')

onMounted(async () => {
  try {
    if (session.value?.type === 'common') {
      const [tenants, commonUsers] = await Promise.all([
        listTenants(session.value.accessToken),
        listCommonUsers(session.value.accessToken),
      ])
      tenantCount.value = tenants.length
      commonUserCount.value = commonUsers.length
      return
    }

    if (session.value?.tenantId) {
      const users = await listTenantUsers(session.value.tenantId, session.value.accessToken)
      tenantUserCount.value = users.length
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not load dashboard'
  }
})
</script>

<template>
  <section class="grid gap-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">
        Dashboard
      </h1>
      <p class="text-sm text-muted-foreground">
        Quick overview for the current session.
      </p>
    </div>

    <p
      v-if="errorMessage"
      class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {{ errorMessage }}
    </p>

    <div class="grid gap-4 md:grid-cols-3">
      <Card v-if="session?.type === 'common'">
        <CardHeader>
          <CardDescription>Tenants</CardDescription>
          <CardTitle>{{ tenantCount ?? '...' }}</CardTitle>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground">
          Workspaces registered in the common database.
        </CardContent>
      </Card>

      <Card v-if="session?.type === 'common'">
        <CardHeader>
          <CardDescription>Common Users</CardDescription>
          <CardTitle>{{ commonUserCount ?? '...' }}</CardTitle>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground">
          Platform-level users.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Tenant Users</CardDescription>
          <CardTitle>{{ tenantUserCount ?? (session?.type === 'common' ? 'Select tenant' : '...') }}</CardTitle>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground">
          Members inside a tenant workspace.
        </CardContent>
      </Card>
    </div>
  </section>
</template>
