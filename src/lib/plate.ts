export type PlateKind = 'blue' | 'green_small' | 'green_large'

export const PROVINCES = [
  '京',
  '津',
  '沪',
  '渝',
  '冀',
  '豫',
  '云',
  '辽',
  '黑',
  '湘',
  '皖',
  '鲁',
  '新',
  '苏',
  '浙',
  '赣',
  '鄂',
  '桂',
  '甘',
  '晋',
  '蒙',
  '陕',
  '吉',
  '闽',
  '贵',
  '粤',
  '青',
  '藏',
  '川',
  '宁',
  '琼',
] as const

// 避免混淆：不使用 I / O
export const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('')

// 新能源：纯电（D/A/B/C/E），非纯电（F/G/H/J/K）
export const EV_PURE = ['D', 'A', 'B', 'C', 'E'] as const
export const EV_NON_PURE = ['F', 'G', 'H', 'J', 'K'] as const
export const EV_LETTERS = [...EV_PURE, ...EV_NON_PURE] as const

export type PlateChars = string[]

export function lengthOf(kind: PlateKind) {
  return kind === 'blue' ? 7 : 8
}

export function defaultChars(kind: PlateKind): PlateChars {
  const len = lengthOf(kind)
  return Array.from({ length: len }, () => '')
}

export function isValidChar(kind: PlateKind, index: number, chRaw: string) {
  const ch = (chRaw || '').toUpperCase()
  if (!ch) return false

  // 0: 省份简称（由选择器赋值）
  if (index === 0) return PROVINCES.includes(ch as (typeof PROVINCES)[number])

  // 1: 发牌字母
  if (index === 1) return LETTERS.includes(ch)

  // 蓝牌：省+字母+5位序号（字母数字混合，排除 I/O）
  if (kind === 'blue') {
    if (index < 2 || index > 6) return false
    return /^[0-9A-HJ-NP-Z]$/.test(ch)
  }

  // 绿牌（小型）：省+字母 + D/F + [A-HJ-NP-Z0-9] + 4位数字
  if (kind === 'green_small') {
    if (index === 2) return (EV_LETTERS as readonly string[]).includes(ch)
    if (index === 3) return /^[0-9A-HJ-NP-Z]$/.test(ch)
    if (index >= 4 && index <= 7) return /^[0-9]$/.test(ch)
    return false
  }

  // 绿牌（大型）：省+字母 + 5位数字 + D/F
  if (kind === 'green_large') {
    if (index >= 2 && index <= 6) return /^[0-9]$/.test(ch)
    if (index === 7) return (EV_LETTERS as readonly string[]).includes(ch)
    return false
  }

  return false
}

export function normalizeChars(kind: PlateKind, chars: PlateChars): PlateChars {
  const len = lengthOf(kind)
  const out = Array.from({ length: len }, (_, i) => (chars[i] || '').toUpperCase())
  // 清理非法字符
  for (let i = 0; i < out.length; i++) {
    if (!out[i]) continue
    if (!isValidChar(kind, i, out[i])) out[i] = ''
  }
  return out
}

export function charsToText(chars: PlateChars) {
  return chars.join('')
}

export function displayText(_kind: PlateKind, chars: PlateChars) {
  const t = charsToText(chars)
  if (t.length < 2) return t
  // 真实车牌通常在第2位后加“·”，这里展示用，不参与输入与存储
  return `${t.slice(0, 2)}·${t.slice(2)}`
}

export function validatePlate(kind: PlateKind, chars: PlateChars): { ok: boolean; reason?: string } {
  const len = lengthOf(kind)
  if (chars.length !== len) return { ok: false, reason: '长度不正确' }
  for (let i = 0; i < len; i++) {
    if (!chars[i]) return { ok: false, reason: '请补全车牌号' }
    if (!isValidChar(kind, i, chars[i])) return { ok: false, reason: '车牌格式不正确' }
  }
  return { ok: true }
}

export function kindLabel(kind: PlateKind) {
  if (kind === 'blue') return '蓝牌'
  if (kind === 'green_small') return '绿牌·小型'
  return '绿牌·大型'
}

export function tryInferGreenKind(chars: PlateChars): PlateKind | null {
  if (chars.length !== 8) return null
  const t = charsToText(chars).toUpperCase()
  // 小型：第3位是 D/F
  if ((EV_LETTERS as readonly string[]).includes(t[2])) return 'green_small'
  // 大型：最后一位是 D/F/A/B/C/E/G/H/J/K
  if ((EV_LETTERS as readonly string[]).includes(t[7])) return 'green_large'
  return null
}
