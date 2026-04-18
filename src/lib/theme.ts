export type ThemeMode = 'auto' | 'light' | 'dark'

const KEY = 'yaoyanpai_theme_mode_v1'

function getMetaThemeColorEl() {
  return document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
}

export function getStoredThemeMode(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY) as ThemeMode | null
    if (v === 'auto' || v === 'light' || v === 'dark') return v
  } catch {
    // ignore
  }
  return 'auto'
}

export function setStoredThemeMode(mode: ThemeMode) {
  localStorage.setItem(KEY, mode)
}

export function resolveTheme(mode: ThemeMode) {
  if (mode === 'light') return 'light'
  if (mode === 'dark') return 'dark'
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyThemeMode(mode: ThemeMode) {
  const resolved = resolveTheme(mode)
  document.documentElement.dataset.theme = resolved

  // 同步浏览器 UI / PWA 状态栏颜色
  const meta = getMetaThemeColorEl()
  if (meta) meta.content = resolved === 'dark' ? '#0b0b10' : '#ffffff'
}

export function initThemeMode() {
  const mode = getStoredThemeMode()
  applyThemeMode(mode)

  if (window.matchMedia) {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (getStoredThemeMode() === 'auto') applyThemeMode('auto')
    }
    mql.addEventListener?.('change', onChange)
  }
}

