import { computed, ref } from 'vue'
import { commonLogin, commonMe, tenantLogin, tenantMe } from '@/shared/api/resources'
import type { User } from '@/shared/types/api'

export type AuthType = 'common' | 'tenant'

export interface AuthSession {
  accessToken: string
  type: AuthType
  user: User
  tenantId?: string
}

const STORAGE_KEY = 'workspace_admin_session'

function readSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

const session = ref<AuthSession | null>(readSession())

function writeSession(nextSession: AuthSession | null) {
  session.value = nextSession

  if (nextSession) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
    return
  }

  localStorage.removeItem(STORAGE_KEY)
}

export function useAuth() {
  const isAuthenticated = computed(() => Boolean(session.value?.accessToken))

  async function loginCommon(email: string, password: string) {
    const response = await commonLogin(email, password)
    writeSession({
      accessToken: response.access_token,
      type: 'common',
      user: response.user,
    })
  }

  async function loginTenant(tenantId: string, email: string, password: string) {
    const response = await tenantLogin(tenantId, email, password)
    writeSession({
      accessToken: response.access_token,
      type: 'tenant',
      user: response.user,
      tenantId,
    })
  }

  async function restoreSession() {
    if (!session.value) {
      return
    }

    try {
      const response = session.value.type === 'common'
        ? await commonMe(session.value.accessToken)
        : await tenantMe(session.value.tenantId || '', session.value.accessToken)

      writeSession({
        ...session.value,
        user: response.user,
      })
    } catch {
      writeSession(null)
    }
  }

  function logout() {
    writeSession(null)
  }

  return {
    isAuthenticated,
    loginCommon,
    loginTenant,
    logout,
    restoreSession,
    session,
  }
}
