import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import type { PlateKind } from '../lib/plate'
import { EV_LETTERS, HK_LETTERS, LETTERS, isValidChar, lockedChar } from '../lib/plate'

type Mode = 'num' | 'alpha'

function alphaKeys() {
  return LETTERS
}

export default function Keypad(props: {
  kind: PlateKind
  activeIndex: number
  onInput: (ch: string) => void
  onBackspace: () => void
  onClose: () => void
}) {
  const [mode, setMode] = useState<Mode>('num')

  const config = useMemo(() => {
    const i = props.activeIndex
    const kind = props.kind

    // 固定字符不需要键盘
    if (lockedChar(kind, i)) return { type: 'none' as const }

    // 绿牌：D/A/B/C/E/F/G/H/J/K 位置（第3位或最后1位）
    if ((kind === 'green_small' && i === 2) || (kind === 'green_large' && i === 7)) {
      return { type: 'ev' as const, keys: [...EV_LETTERS] }
    }

    // 其余：由 isValidChar 决定数字/字母可用性
    const anyDigit = ['0','1','2','3','4','5','6','7','8','9'].some((d) => isValidChar(kind, i, d))
    const anyLetter = HK_LETTERS.some((d) => isValidChar(kind, i, d)) || alphaKeys().some((d) => isValidChar(kind, i, d))
    if (anyDigit && !anyLetter) return { type: 'num' as const }
    if (!anyDigit && anyLetter) return { type: 'alpha' as const }
    return { type: 'alnum' as const }
  }, [props.activeIndex, props.kind])

  const keys = useMemo(() => {
    if (config.type === 'none') return []
    if (config.type === 'ev') return config.keys
    if (config.type === 'num') return ['1','2','3','4','5','6','7','8','9','0']
    if (config.type === 'alpha') {
      // 港澳字母避免 I/O/Q
      return props.kind === 'hk' || props.kind === 'mo' ? HK_LETTERS : alphaKeys()
    }
    // alnum
    if (mode === 'alpha') return props.kind === 'hk' || props.kind === 'mo' ? HK_LETTERS : alphaKeys()
    return ['1','2','3','4','5','6','7','8','9','0']
  }, [config, mode, props.kind])

  if (config.type === 'none') return null

  return (
    <div className="mx-auto w-full max-w-[420px] px-4">
      <div className="glass-card mb-3 overflow-hidden rounded-[26px] p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <button
            className="grid h-9 w-9 place-items-center rounded-full bg-black text-white shadow-[0_18px_30px_-18px_rgba(0,0,0,0.75)]"
            aria-label="关闭键盘"
            onClick={props.onClose}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="text-[12px] font-semibold text-[color:var(--app-subtext)]">
            {config.type === 'alnum' ? '输入' : config.type === 'ev' ? '选择 D/F…' : '数字键盘'}
          </div>
          <div className="flex items-center gap-2">
            {config.type === 'alnum' ? (
              <>
                <button
                  className={clsx(
                    'rounded-full px-3 py-1 text-[12px] font-semibold',
                    mode === 'num'
                      ? 'bg-black text-white'
                      : 'bg-black/10 text-[color:var(--app-text)]',
                  )}
                  onClick={() => setMode('num')}
                >
                  数字
                </button>
                <button
                  className={clsx(
                    'rounded-full px-3 py-1 text-[12px] font-semibold',
                    mode === 'alpha'
                      ? 'bg-black text-white'
                      : 'bg-black/10 text-[color:var(--app-text)]',
                  )}
                  onClick={() => setMode('alpha')}
                >
                  字母
                </button>
              </>
            ) : (
              <button
                className="rounded-full bg-black/10 px-3 py-1 text-[12px] font-semibold text-[color:var(--app-text)]"
                onClick={props.onBackspace}
              >
                退格
              </button>
            )}
          </div>
        </div>

        <div
          className={clsx(
            'grid gap-2',
            mode === 'alpha' ? 'grid-cols-7' : 'grid-cols-5',
          )}
        >
          {keys.map((k) => {
            const disabled = !isValidChar(props.kind, props.activeIndex, k)
            return (
              <button
                key={k}
                disabled={disabled}
                className={clsx(
                  'grid h-11 place-items-center rounded-[16px] font-semibold',
                  'shadow-[0_12px_26px_-20px_rgba(0,0,0,0.45)]',
                  // 夜间模式避免 text-black/* 导致可读性问题，使用变量色
                  disabled
                    ? 'bg-black/10 text-[color:var(--app-subtext)]'
                    : 'bg-white text-[color:var(--app-text)]',
                )}
                style={
                  !disabled && document.documentElement.dataset.theme === 'dark'
                    ? { background: 'rgba(255,255,255,0.10)' }
                    : undefined
                }
                onClick={() => props.onInput(k)}
              >
                {k}
              </button>
            )
          })}

          {config.type === 'alnum' ? (
            <button
              className="col-span-2 grid h-11 place-items-center rounded-[16px] bg-black/10 text-[12px] font-semibold text-[color:var(--app-text)]"
              onClick={props.onBackspace}
            >
              退格
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
