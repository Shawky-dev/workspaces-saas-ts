<script setup lang="ts">
import {
  Building2,
  LayoutDashboard,
  LogOut,
  MoonStar,
  SunMedium,
  Users,
} from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useTheme } from '@/composables/useTheme'
import { useAuth } from '@/features/auth/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { isDark, toggleTheme } = useTheme()
const { logout, session } = useAuth()

const navItems = computed(() => {
  if (session.value?.type === 'tenant' && session.value.tenantId) {
    return [
      {
        label: 'Tenant Users',
        to: `/${session.value.tenantId}/users`,
        icon: Users,
      },
    ]
  }

  return [
    { label: 'Dashboard', to: '/common', icon: LayoutDashboard },
    { label: 'Tenants', to: '/common/tenants', icon: Building2 },
    { label: 'Common Users', to: '/common/common-users', icon: Users },
  ]
})

function handleLogout() {
  logout()
  void router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <div class="grid min-h-screen lg:grid-cols-[260px_1fr]">
      <aside class="border-b bg-sidebar text-sidebar-foreground lg:border-b-0 lg:border-r">
        <div class="flex h-full flex-col">
          <div class="flex h-16 items-center justify-between px-4">
            <div>
              <p class="text-sm font-semibold">
                Workspaces
              </p>
              <p class="text-xs text-muted-foreground">
                Admin panel
              </p>
            </div>
            <Button
              variant="outline"
              size="icon-sm"
              :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
              @click="toggleTheme"
            >
              <SunMedium
                v-if="isDark"
                class="h-4 w-4"
              />
              <MoonStar
                v-else
                class="h-4 w-4"
              />
            </Button>
          </div>

          <Separator />

          <nav class="grid gap-1 p-3">
            <Button
              v-for="item in navItems"
              :key="item.to"
              as-child
              :variant="route.path === item.to ? 'secondary' : 'ghost'"
              class="justify-start"
            >
              <RouterLink :to="item.to">
                <component
                  :is="item.icon"
                  class="h-4 w-4"
                />
                {{ item.label }}
              </RouterLink>
            </Button>
          </nav>

          <div class="mt-auto grid gap-3 p-4">
            <div class="grid gap-1 rounded-md border bg-background p-3">
              <div class="flex items-center justify-between gap-2">
                <p class="truncate text-sm font-medium">
                  {{ session?.user.name }}
                </p>
                <Badge variant="secondary">
                  {{ session?.type }}
                </Badge>
              </div>
              <p class="truncate text-xs text-muted-foreground">
                {{ session?.user.email }}
              </p>
              <p
                v-if="session?.tenantId"
                class="truncate text-xs text-muted-foreground"
              >
                Tenant: {{ session.tenantId }}
              </p>
            </div>
            <Button
              variant="outline"
              class="justify-start"
              @click="handleLogout"
            >
              <LogOut class="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <main class="min-w-0">
        <div class="mx-auto grid w-full max-w-6xl gap-6 p-4 md:p-6">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>
