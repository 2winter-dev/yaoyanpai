import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import type { PlateKind } from '../lib/plate'
import { EV_LETTERS, LETTERS, isValidChar } from '../lib/plate'

type Mode = 'num' | 'alpha'

function alphaKeys() {
  // 不含 I/O
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

    // 省/字母由上层按钮处理
    if (i === 0 || i === 1) return { type: 'none' as const }

    // 绿牌：D/A/B/C/E/F/G/H/J/K 位置（第3位或最后1位）
    if ((kind === 'green_small' && i === 2) || (kind === 'green_large' && i === 7)) {
      return { type: 'ev' as const, keys: [...EV_LETTERS] }
    }

    // 绿牌：纯数字位置
    if (kind === 'green_small' && i >= 4) return { type: 'num' as const }
    if (kind === 'green_large' && i >= 2 && i <= 6) return { type: 'num' as const }

    // 蓝牌/绿牌第4位：可能是字母或数字
    return { type: 'alnum' as const }
  }, [props.activeIndex, props.kind])

  const keys = useMemo(() => {
    if (config.type === 'none') return []
    if (config.type === 'ev') return config.keys
    if (config.type === 'num') return ['1','2','3','4','5','6','7','8','9','0']
    // alnum
    if (mode === 'alpha') return alphaKeys()
    return ['1','2','3','4','5','6','7','8','9','0']
  }, [config, mode])

  if (config.type === 'none') return null

  return (
    <div className="mx-auto w-full max-w-[420px] px-4">
      <div className="glass-card relative mb-3 overflow-hidden rounded-[26px] p-3">
        {/* 右下角关闭 */}
        <button
          className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-black text-white shadow-[0_18px_30px_-18px_rgba(0,0,0,0.75)]"
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
        {config.type === 'alnum' ? (
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="text-[12px] font-semibold text-black/50">输入</div>
            <div className="flex gap-2">
              <button
                className={clsx(
                  'rounded-full px-3 py-1 text-[12px] font-semibold',
                  mode === 'num' ? 'bg-black text-white' : 'bg-black/5 text-black/60',
                )}
                onClick={() => setMode('num')}
              >
                数字
              </button>
              <button
                className={clsx(
                  'rounded-full px-3 py-1 text-[12px] font-semibold',
                  mode === 'alpha' ? 'bg-black text-white' : 'bg-black/5 text-black/60',
                )}
                onClick={() => setMode('alpha')}
              >
                字母
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="text-[12px] font-semibold text-black/50">
              {config.type === 'ev' ? '选择 D/F…' : '数字键盘'}
            </div>
            <button
              className="rounded-full bg-black/5 px-3 py-1 text-[12px] font-semibold text-black/60"
              onClick={props.onBackspace}
            >
              退格
            </button>
          </div>
        )}

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
                  disabled ? 'bg-black/5 text-black/25' : 'bg-white text-black/80',
                )}
                onClick={() => props.onInput(k)}
              >
                {k}
              </button>
            )
          })}

          {config.type === 'alnum' ? (
            <button
              className="col-span-2 grid h-11 place-items-center rounded-[16px] bg-black/5 text-[12px] font-semibold text-black/60"
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
