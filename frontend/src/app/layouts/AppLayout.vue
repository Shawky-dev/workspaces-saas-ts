<script setup lang="ts">
import {
  Building2,
  Boxes,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  Users,
} from 'lucide-vue-next'

import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'


import { useAuth } from '@/features/auth/composables/useAuth'

import type { TenantUserRole } from '@/shared/types/api'

const route = useRoute()
const router = useRouter()


const { logout, session } = useAuth()

interface NavItem {
  label: string
  to: string
  icon: any
  allowedRoles?: TenantUserRole[]
}

const navItems = computed<NavItem[]>(() => {
  if (session.value?.type === 'tenant' && session.value.tenantId) {
    const role = session.value.user.role as TenantUserRole | undefined
    const tenantId = session.value.tenantId

    const allItems: NavItem[] = [
      {
        label: 'Sessions',
        to: `/${tenantId}/sessions`,
        icon: ClipboardList,
        allowedRoles: ['super_admin', 'receptionist'],
      },
      {
        label: 'Reservations',
        to: `/${tenantId}/reservations`,
        icon: CalendarClock,
        allowedRoles: ['super_admin', 'receptionist'],
      },
      {
        label: 'Catalog',
        to: `/${tenantId}/catalog`,
        icon: Package,
        allowedRoles: ['super_admin', 'supplier'],
      },
      {
        label: 'Inventory',
        to: `/${tenantId}/inventory`,
        icon: Boxes,
        allowedRoles: ['super_admin', 'supplier'],
      },
      {
        label: 'Tenant Users',
        to: `/${tenantId}/users`,
        icon: Users,
        allowedRoles: ['super_admin'],
      },
      {
        label: 'Rooms',
        to: `/${tenantId}/rooms`,
        icon: Building2,
        allowedRoles: ['super_admin', 'receptionist'],
      },
      {
        label: 'Customers',
        to: `/${tenantId}/customers`,
        icon: Users,
        allowedRoles: ['super_admin', 'receptionist'],
      },
      {
        label: 'Receipts',
        to: `/${tenantId}/receipts`,
        icon: ReceiptText,
        allowedRoles: ['super_admin', 'receptionist'],
      },
    ]

    return role
      ? allItems.filter(
          item => !item.allowedRoles || item.allowedRoles.includes(role),
        )
      : allItems
  }

  return [
    {
      label: 'Dashboard',
      to: '/common',
      icon: LayoutDashboard,
    },
    {
      label: 'Tenants',
      to: '/common/tenants',
      icon: Building2,
    },
    {
      label: 'Common Users',
      to: '/common/common-users',
      icon: Users,
    },
  ]
})

function handleLogout() {
  logout()
  void router.push('/login')
}
</script>

```vue
<template>
  <div class="min-h-screen bg-[#050816] text-white">
    <div class="grid min-h-screen lg:grid-cols-[280px_1fr]">

      <!-- SIDEBAR -->
      <aside
        class="
          border-r border-white/10
          bg-[#050816]/95
          backdrop-blur-2xl
          text-white
        "
      >
        <div class="flex h-full flex-col">

          <!-- HEADER -->
          <div class="flex h-20 items-center px-6">
            <div>
              <p class="text-lg font-bold tracking-wide text-white">
                Workspaces
              </p>

              <p class="text-xs text-gray-400">
                Admin panel
              </p>
            </div>
          </div>

          <Separator class="bg-white/10" />

          <!-- NAVIGATION -->
          <nav class="grid gap-2 p-4">
            <RouterLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="
                flex items-center gap-3
                rounded-xl
                border
                px-4 py-3
                transition-all duration-200
              "
              :class="
                route.path === item.to
                  ? 'border-pink-500/40 bg-pink-500/20 text-pink-300 shadow-lg shadow-pink-500/10'
                  : 'border-transparent text-gray-300 hover:border-pink-500/20 hover:bg-white/5 hover:text-white'
              "
            >
              <component
                :is="item.icon"
                class="h-4 w-4"
              />

              {{ item.label }}
            </RouterLink>
          </nav>

          <!-- USER -->
          <div class="mt-auto grid gap-4 p-4">
            <div
              class="
                rounded-2xl
                border border-white/10
                bg-white/5
                p-4
                backdrop-blur-xl
                shadow-2xl
              "
            >
              <div class="flex items-center justify-between gap-2">
                <p class="truncate text-sm font-semibold text-white">
                  {{ session?.user.name }}
                </p>

                <Badge
                  class="
                    border-0
                    bg-gradient-to-r
                    from-pink-500
                    to-fuchsia-600
                    text-white
                  "
                >
                  {{ session?.user.role ?? session?.type }}
                </Badge>
              </div>

              <p class="mt-2 truncate text-xs text-gray-400">
                {{ session?.user.email }}
              </p>

              <p
                v-if="session?.tenantId"
                class="mt-1 truncate text-xs text-gray-500"
              >
                Tenant: {{ session.tenantId }}
              </p>
            </div>

            <!-- LOGOUT -->
            <Button
              variant="ghost"
              class="
                justify-start
                border border-white/10
                bg-white/5
                text-white
                hover:bg-red-500/10
                hover:text-red-300
              "
              @click="handleLogout"
            >
              <LogOut class="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <!-- MAIN -->
      <main class="relative min-w-0 overflow-hidden bg-[#050816]">

        <!-- BACKGROUND IMAGE -->
        <img
          src="/src/assets/bg.png"
          alt=""
          class="
            absolute
            inset-0
            h-full
            w-full
            object-cover
            opacity-40
            pointer-events-none
            select-none
          "
        />

        <!-- OVERLAY -->
        <div
          class="
            absolute inset-0
            bg-gradient-to-br
            from-[#050816]/72
            via-[#081020]/58
            to-[#050816]/78
          "
        />

        <!-- CONTENT -->
        <div class="relative z-10">
          <div class="mx-auto grid w-full max-w-7xl gap-6 p-6">
            <RouterView />
          </div>
        </div>

      </main>
    </div>
  </div>
</template>
```
