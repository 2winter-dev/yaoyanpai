import type { PlateChars, PlateKind } from './plate'

export type HistoryItem = {
  id: string
  kind: PlateKind
  chars: PlateChars
  sealed?: boolean
  createdAt: number
}

const KEY = 'yaoyanpai_history_v1'

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HistoryItem[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(Boolean).slice(0, 200)
  } catch {
    return []
  }
}

export function saveHistory(items: HistoryItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, 200)))
}

export function addHistory(item: Omit<HistoryItem, 'id' | 'createdAt'>) {
  const items = loadHistory()
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`

  const next: HistoryItem = {
    id,
    createdAt: Date.now(),
    ...item,
  }

  // 去重：同车牌同类型，保留最新
  const normalized = items.filter((x) => !(x.kind === next.kind && x.chars.join('') === next.chars.join('')))
  const merged = [next, ...normalized]
  saveHistory(merged)
  return next
}

export function removeHistory(id: string) {
  const items = loadHistory()
  saveHistory(items.filter((x) => x.id !== id))
}

export function clearHistory() {
  saveHistory([])
}
