export type PlateKind =
  | 'blue'
  | 'green_small'
  | 'green_large'
  | 'moto'
  | 'hk'
  | 'mo'
  | 'tw'
  | 'yuez_hk'
  | 'yuez_mo'
  | 'fv'
  | 'fu'
  | 'ft'

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
// 港澳常见规则：不使用 I / O / Q
export const HK_LETTERS = LETTERS.filter((x) => x !== 'Q')

// 新能源：纯电（D/A/B/C/E），非纯电（F/G/H/J/K）
export const EV_PURE = ['D', 'A', 'B', 'C', 'E'] as const
export const EV_NON_PURE = ['F', 'G', 'H', 'J', 'K'] as const
export const EV_LETTERS = [...EV_PURE, ...EV_NON_PURE] as const

export type PlateChars = string[]

export function lengthOf(kind: PlateKind) {
  switch (kind) {
    case 'blue':
      return 7
    case 'green_small':
    case 'green_large':
      return 8
    case 'moto':
      return 7
    case 'tw':
      return 7
    case 'hk':
    case 'mo':
    case 'fv':
    case 'fu':
    case 'ft':
      return 6
    case 'yuez_hk':
    case 'yuez_mo':
      return 7
  }
}

export function defaultChars(kind: PlateKind): PlateChars {
  const len = lengthOf(kind)
  const out = Array.from({ length: len }, () => '')

  // 给每种模板一个更友好的默认牌（避免空白）
  if (kind === 'blue') return ['粤', 'L', '0', '4', '0', '1', '8']
  if (kind === 'green_small') return ['粤', 'A', 'D', 'A', '1', '2', '3', '4']
  if (kind === 'green_large') return ['粤', 'A', '1', '2', '3', '4', '5', 'D']
  // 普通摩托车：220×140（黄底黑字），这里使用“粤A12345”作为默认示例
  if (kind === 'moto') return ['粤', 'A', '1', '2', '3', '4', '5']
  if (kind === 'hk') return ['A', 'B', '1', '2', '3', '4']
  if (kind === 'mo') return ['M', 'A', '1', '2', '3', '4']
  if (kind === 'tw') return ['A', 'B', 'C', '1', '2', '3', '4']
  if (kind === 'fv') return ['F', 'V', '1', '2', '3', '4']
  if (kind === 'fu') return ['F', 'U', '1', '2', '3', '4']
  if (kind === 'ft') return ['F', 'T', '1', '2', '3', '4']
  // 固定前缀/后缀（两地牌）
  if (kind === 'yuez_hk') {
    out[0] = '粤'
    out[1] = 'Z'
    out[6] = '港'
    out[2] = '1'
    out[3] = '2'
    out[4] = '3'
    out[5] = '4'
  }
  if (kind === 'yuez_mo') {
    out[0] = '粤'
    out[1] = 'Z'
    out[6] = '澳'
    out[2] = '1'
    out[3] = '2'
    out[4] = '3'
    out[5] = '4'
  }
  return out
}

export function lockedChar(kind: PlateKind, index: number): string | null {
  if (kind === 'yuez_hk') {
    if (index === 0) return '粤'
    if (index === 1) return 'Z'
    if (index === 6) return '港'
  }
  if (kind === 'yuez_mo') {
    if (index === 0) return '粤'
    if (index === 1) return 'Z'
    if (index === 6) return '澳'
  }
  if (kind === 'fv') {
    if (index === 0) return 'F'
    if (index === 1) return 'V'
  }
  if (kind === 'fu') {
    if (index === 0) return 'F'
    if (index === 1) return 'U'
  }
  if (kind === 'ft') {
    if (index === 0) return 'F'
    if (index === 1) return 'T'
  }
  if (kind === 'mo') {
    if (index === 0) return 'M'
  }
  return null
}

export function isValidChar(kind: PlateKind, index: number, chRaw: string) {
  const ch = (chRaw || '').toUpperCase()
  if (!ch) return false

  // 固定字符（两地牌/澳门M）
  const locked = lockedChar(kind, index)
  if (locked) return ch === locked

  // 0: 省份简称（仅普通内地号牌）
  if (
    index === 0 &&
    (kind === 'blue' || kind === 'green_small' || kind === 'green_large' || kind === 'moto')
  ) {
    return PROVINCES.includes(ch as (typeof PROVINCES)[number])
  }

  // 1: 发牌字母（仅普通内地号牌）
  if (
    index === 1 &&
    (kind === 'blue' || kind === 'green_small' || kind === 'green_large' || kind === 'moto')
  ) {
    return LETTERS.includes(ch)
  }

  // 香港：2字母 + 4数字（不允许前导0）
  if (kind === 'hk') {
    // 同时支持：
    // 1) 纯数字 1~9999（1~4位，不允许前导0）
    // 2) 2字母 + 1~4位数字（不允许前导0）
    if (index === 0) return HK_LETTERS.includes(ch) || /^[1-9]$/.test(ch)
    if (index === 1) return HK_LETTERS.includes(ch) || /^[0-9]$/.test(ch)
    if (index === 2) return /^[0-9]$/.test(ch)
    if (index >= 3 && index <= 5) return /^[0-9]$/.test(ch)
    return false
  }

  // 台湾：常见格式为 3字母-4数字（官方承诺不使用 I/O；这里沿用 LETTERS）
  if (kind === 'tw') {
    if (index >= 0 && index <= 2) return LETTERS.includes(ch)
    if (index >= 3 && index <= 6) return /^[0-9]$/.test(ch)
    return false
  }

  // 澳门：M + 字母 + 4数字（简化输入为 MA1234；展示时可加分隔）
  if (kind === 'mo') {
    if (index === 1) return HK_LETTERS.includes(ch)
    if (index >= 2 && index <= 5) return /^[0-9]$/.test(ch)
    return false
  }

  // 粤Z港/澳：粤Z + 4数字 + 港/澳
  if (kind === 'yuez_hk' || kind === 'yuez_mo') {
    if (index >= 2 && index <= 5) return /^[0-9]$/.test(ch)
    return false
  }

  // 粤车南下：FV/FU/FT + 4数字
  if (kind === 'fv' || kind === 'fu' || kind === 'ft') {
    if (index >= 2 && index <= 5) return /^[0-9]$/.test(ch)
    return false
  }

  // 蓝牌：省+字母+5位序号（字母数字混合，排除 I/O）
  if (kind === 'blue') {
    if (index < 2 || index > 6) return false
    return /^[0-9A-HJ-NP-Z]$/.test(ch)
  }

  // 普通摩托车：省+字母+5位数字（这里按常见“粤A12345”实现）
  if (kind === 'moto') {
    if (index < 2 || index > 6) return false
    return /^[0-9]$/.test(ch)
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
  // 写回固定字符
  for (let i = 0; i < out.length; i++) {
    const locked = lockedChar(kind, i)
    if (locked) out[i] = locked
  }
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

export function displayText(kind: PlateKind, chars: PlateChars) {
  const t = charsToText(chars)
  if (!t) return ''

  // 内地：第2位后加“·”
  if (kind === 'blue' || kind === 'green_small' || kind === 'green_large' || kind === 'yuez_hk' || kind === 'yuez_mo') {
    if (t.length < 2) return t
    return `${t.slice(0, 2)}·${t.slice(2)}`
  }

  // 香港 / FV / FU / FT：前缀 + 空格 + 数字
  if (kind === 'hk' || kind === 'fv' || kind === 'fu' || kind === 'ft') {
    if (kind === 'hk') {
      // 纯数字：直接显示数字
      if (/^[0-9]+$/.test(t)) return t
      // 字母+数字：AB 1234
      if (t.length <= 2) return t
      return `${t.slice(0, 2)} ${t.slice(2)}`
    }
    if (t.length <= 2) return t
    return `${t.slice(0, 2)} ${t.slice(2)}`
  }

  // 台湾：ABC-1234
  if (kind === 'tw') {
    if (t.length <= 3) return t
    return `${t.slice(0, 3)}-${t.slice(3)}`
  }

  // 澳门：MA-12-34
  if (kind === 'mo') {
    if (t.length < 2) return t
    const p = t.slice(0, 2)
    const n1 = t.slice(2, 4)
    const n2 = t.slice(4, 6)
    if (!n1) return p
    if (!n2) return `${p}-${n1}`
    return `${p}-${n1}-${n2}`
  }

  return t
}

export function validatePlate(kind: PlateKind, chars: PlateChars): { ok: boolean; reason?: string } {
  const len = lengthOf(kind)
  if (chars.length !== len) return { ok: false, reason: '长度不正确' }

  // 香港：允许 2字母 + 1~4 位数字（末尾空位视为未用，但不允许中间断档）
  if (kind === 'hk') {
    const c0 = (chars[0] || '').toUpperCase()
    const c1 = (chars[1] || '').toUpperCase()

    const isDigit = (x: string) => /^[0-9]$/.test(x)
    const isLetter = (x: string) => HK_LETTERS.includes(x)

    // 模式A：纯数字 1~9999（放在前4格：0..3），不允许前导0
    if (c0 && isDigit(c0)) {
      if (c0 === '0') return { ok: false, reason: '车牌格式不正确' }
      const ds = [chars[0], chars[1], chars[2], chars[3]].map((x) => (x || '').toUpperCase())
      let count = 0
      let ended = false
      for (let i = 0; i < 4; i++) {
        const v = ds[i]
        if (!v) {
          if (count > 0) ended = true
          continue
        }
        if (ended) return { ok: false, reason: '车牌格式不正确' }
        if (!isDigit(v)) return { ok: false, reason: '车牌格式不正确' }
        count++
      }
      // 后两格必须为空（避免输入到 5-6 位）
      if ((chars[4] || chars[5])) return { ok: false, reason: '车牌格式不正确' }
      if (count < 1) return { ok: false, reason: '请补全车牌号' }
      return { ok: true }
    }

    // 模式B：2字母 + 1~4数字（2..5），不允许前导0
    if (!c0 || !c1) return { ok: false, reason: '请补全车牌号' }
    if (!isLetter(c0) || !isLetter(c1)) return { ok: false, reason: '车牌格式不正确' }

    let count = 0
    let ended = false
    for (let i = 2; i <= 5; i++) {
      const v = (chars[i] || '').toUpperCase()
      if (!v) {
        if (count > 0) ended = true
        continue
      }
      if (ended) return { ok: false, reason: '车牌格式不正确' }
      if (count === 0 && v === '0') return { ok: false, reason: '车牌格式不正确' }
      if (!isDigit(v)) return { ok: false, reason: '车牌格式不正确' }
      count++
    }
    if (count < 1) return { ok: false, reason: '请补全车牌号' }
    return { ok: true }
  }

  for (let i = 0; i < len; i++) {
    if (!chars[i]) return { ok: false, reason: '请补全车牌号' }
    if (!isValidChar(kind, i, chars[i])) return { ok: false, reason: '车牌格式不正确' }
  }
  return { ok: true }
}

export function kindLabel(kind: PlateKind) {
  if (kind === 'blue') return '普通蓝牌'
  if (kind === 'green_small') return '普通绿牌·小型新能源'
  if (kind === 'green_large') return '普通绿牌·大型新能源'
  if (kind === 'moto') return '普通摩托车牌'
  if (kind === 'hk') return '香港车牌'
  if (kind === 'mo') return '澳门车牌'
  if (kind === 'tw') return '台湾省车牌'
  if (kind === 'yuez_hk') return '粤Z（港）两地牌'
  if (kind === 'yuez_mo') return '粤Z（澳）两地牌'
  // 你确认：FT 为粤车南下；FU/FV 为广东两地牌（可往返港澳与广东）
  if (kind === 'fv') return 'FV（广东两地牌）'
  if (kind === 'fu') return 'FU（广东两地牌）'
  return 'FT（粤车南下）'
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
