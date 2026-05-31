import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from './layouts/AppLayout.vue'
import { useAuth } from '@/features/auth/composables/useAuth'
import type { TenantUserRole } from '@/shared/types/api'
import LoginView from '@/features/auth/views/LoginView.vue'
import DashboardView from '@/features/dashboard/views/DashboardView.vue'
import TenantsView from '@/features/tenants/views/TenantsView.vue'
import CommonUsersView from '@/features/common-users/views/CommonUsersView.vue'
import TenantUsersView from '@/features/tenant-users/views/TenantUsersView.vue'
import CatalogView from '@/features/catalog/views/CatalogView.vue'
import InventoryView from '@/features/inventory/views/InventoryView.vue'
import RoomsView from '@/features/rooms/views/RoomsView.vue'
import CustomersView from '@/features/customers/views/CustomersView.vue'
import SessionsView from '@/features/sessions/views/SessionsView.vue'
import ReceiptsView from '@/features/receipts/views/ReceiptsView.vue'
import ReservationsView from '@/features/reservations/views/ReservationsView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    authType?: 'common' | 'tenant'
    allowedRoles?: TenantUserRole[]
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      redirect: () => {
        const { session } = useAuth()

        if (session.value?.type === 'common') {
          return { name: 'dashboard' }
        }

        if (session.value?.type === 'tenant' && session.value.tenantId) {
          const role = session.value.user.role
          const tenantSlug = session.value.tenantId
          return role === 'supplier'
            ? { name: 'tenant-catalog', params: { tenantSlug } }
            : { name: 'tenant-sessions', params: { tenantSlug } }
        }

        return { name: 'login' }
      },
    },
    {
      path: '/common',
      component: AppLayout,
      meta: { requiresAuth: true, authType: 'common' },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardView,
        },
        {
          path: 'tenants',
          name: 'tenants',
          component: TenantsView,
        },
        {
          path: 'common-users',
          name: 'common-users',
          component: CommonUsersView,
        },
      ],
    },
    {
      path: '/:tenantSlug',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'sessions',
          name: 'tenant-sessions',
          component: SessionsView,
          meta: { authType: 'tenant', allowedRoles: ['super_admin', 'receptionist'] },
        },
        {
          path: 'reservations',
          name: 'tenant-reservations',
          component: ReservationsView,
          meta: { authType: 'tenant', allowedRoles: ['super_admin', 'receptionist'] },
        },
        {
          path: 'users',
          name: 'tenant-users',
          component: TenantUsersView,
          meta: { authType: 'tenant', allowedRoles: ['super_admin'] },
        },
        {
          path: 'catalog',
          name: 'tenant-catalog',
          component: CatalogView,
          meta: { authType: 'tenant', allowedRoles: ['super_admin', 'supplier'] },
        },
        {
          path: 'inventory',
          name: 'tenant-inventory',
          component: InventoryView,
          meta: { authType: 'tenant', allowedRoles: ['super_admin', 'supplier'] },
        },
        {
          path: 'rooms',
          name: 'tenant-rooms',
          component: RoomsView,
          meta: { authType: 'tenant', allowedRoles: ['super_admin', 'receptionist'] },
        },
        {
          path: 'customers',
          name: 'tenant-customers',
          component: CustomersView,
          meta: { authType: 'tenant', allowedRoles: ['super_admin', 'receptionist'] },
        },
        {
          path: 'receipts',
          name: 'tenant-receipts',
          component: ReceiptsView,
          meta: { authType: 'tenant', allowedRoles: ['super_admin', 'receptionist'] },
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const { isAuthenticated, session, logout } = useAuth()

  // Stale session from before RBAC: tenant user has no role — clear and re-login
  if (session.value?.type === 'tenant' && !session.value.user.role) {
    logout()
    if (to.name !== 'login') return { name: 'login' }
    return true
  }

  if (to.name === 'login' && isAuthenticated.value) {
    if (session.value?.type === 'tenant' && session.value.tenantId) {
      const role = session.value.user.role
      const tenantSlug = session.value.tenantId
      return role === 'supplier'
        ? { name: 'tenant-catalog', params: { tenantSlug } }
        : { name: 'tenant-sessions', params: { tenantSlug } }
    }

    return { name: 'dashboard' }
  }

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: 'login' }
  }

  if (to.meta.authType && session.value?.type !== to.meta.authType) {
    if (session.value?.type === 'tenant' && session.value.tenantId) {
      return { name: 'tenant-sessions', params: { tenantSlug: session.value.tenantId } }
    }

    if (session.value?.type === 'common') {
      return { name: 'dashboard' }
    }

    return { name: 'login' }
  }

  if (
    (to.name === 'tenant-users' || to.name === 'tenant-catalog' || to.name === 'tenant-inventory' || to.name === 'tenant-rooms' || to.name === 'tenant-customers' || to.name === 'tenant-sessions' || to.name === 'tenant-receipts' || to.name === 'tenant-reservations')
    && session.value?.type === 'tenant'
  ) {
    const tenantSlug = Array.isArray(to.params.tenantSlug)
      ? to.params.tenantSlug[0]
      : to.params.tenantSlug

    if (tenantSlug !== session.value.tenantId) {
      return { name: to.name as string, params: { tenantSlug: session.value.tenantId } }
    }
  }

  if (to.meta.allowedRoles?.length) {
    const role = session.value?.user.role
    if (!role) {
      return { name: 'login' }
    }
    if (!to.meta.allowedRoles.includes(role)) {
      const tenantSlug = session.value?.tenantId
      return role === 'supplier'
        ? { name: 'tenant-catalog', params: { tenantSlug } }
        : { name: 'tenant-sessions', params: { tenantSlug } }
    }
  }

  return true
})
