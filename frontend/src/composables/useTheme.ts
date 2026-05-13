import { computed, ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'theme'

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark'
}

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function readStoredTheme(): Theme | null {
  if (typeof window === 'undefined') {
    return null
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return isTheme(stored) ? stored : null
}

export function initTheme() {
  const theme = readStoredTheme() ?? getSystemTheme()
  applyTheme(theme)
  return theme
}

export function useTheme() {
  const theme = ref<Theme>(initTheme())

  watch(theme, (value) => {
    applyTheme(value)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, value)
    }
  }, { immediate: false })

  const isDark = computed(() => theme.value === 'dark')

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  const setTheme = (value: Theme) => {
    theme.value = value
  }

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  }
}
