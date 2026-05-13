import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from './layouts/AppLayout.vue'
import { useAuth } from '@/features/auth/composables/useAuth'
import LoginView from '@/features/auth/views/LoginView.vue'
import DashboardView from '@/features/dashboard/views/DashboardView.vue'
import TenantsView from '@/features/tenants/views/TenantsView.vue'
import CommonUsersView from '@/features/common-users/views/CommonUsersView.vue'
import TenantUsersView from '@/features/tenant-users/views/TenantUsersView.vue'

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
      component: AppLayout,
      meta: { requiresAuth: true },
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
          meta: { authType: 'common' },
        },
        {
          path: 'common-users',
          name: 'common-users',
          component: CommonUsersView,
          meta: { authType: 'common' },
        },
        {
          path: 'tenant-users',
          name: 'tenant-users',
          component: TenantUsersView,
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const { isAuthenticated, session } = useAuth()

  if (to.name === 'login' && isAuthenticated.value) {
    return { name: 'dashboard' }
  }

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: 'login' }
  }

  if (to.meta.authType && session.value?.type !== to.meta.authType) {
    return { name: 'dashboard' }
  }

  return true
})
