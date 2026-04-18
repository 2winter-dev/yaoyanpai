import { clsx } from 'clsx'
import { useMemo, useRef, useState } from 'react'
import type { PlateChars, PlateKind } from '../lib/plate'
import {
  LETTERS,
  PROVINCES,
  defaultChars,
  isValidChar,
  lengthOf,
  normalizeChars,
  tryInferGreenKind,
} from '../lib/plate'
import Keypad from './Keypad'
import Sheet from './Sheet'

function cleanText(raw: string) {
  return raw.replace(/[·.\s-]/g, '').toUpperCase()
}

function typeBtnClass(kind: PlateKind) {
  if (kind === 'blue') return 'bg-gradient-to-b from-[#2b6cff] to-[#1f50d8] text-white'
  return 'bg-gradient-to-b from-[#20d66f] to-[#0fae55] text-white'
}

function typeBtnText(kind: PlateKind) {
  return kind === 'blue' ? '蓝' : '绿'
}

function placeholder(kind: PlateKind, i: number) {
  if (i === 0) return '省'
  if (i === 1) return 'A'
  if (kind === 'blue') return '·'
  if (kind === 'green_small') {
    if (i === 2) return 'D'
    return '·'
  }
  if (kind === 'green_large') {
    if (i === 7) return 'D'
    return '·'
  }
  return '·'
}

export default function PlateInputBar(props: {
  kind: PlateKind
  chars: PlateChars
  onKindChange: (k: PlateKind) => void
  onCharsChange: (c: PlateChars) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [activeIndex, setActiveIndex] = useState<number>(2)
  const [dragging, setDragging] = useState(false)
  const barRef = useRef<HTMLDivElement | null>(null)
  const [keypadOpen, setKeypadOpen] = useState(false)
  const [openKind, setOpenKind] = useState(false)
  const [openProvince, setOpenProvince] = useState(false)
  const [openLetter, setOpenLetter] = useState(false)

  const len = lengthOf(props.kind)
  const cells = useMemo(() => {
    const base = Array.from({ length: len }, (_, i) => props.chars[i] || '')
    return base
  }, [props.chars, len])

  function focusTyping(index = activeIndex) {
    const safeIndex = Math.max(2, Math.min(index, len - 1))
    setActiveIndex(safeIndex)
    inputRef.current?.focus()
  }

  function patchAt(index: number, ch: string) {
    const next = [...cells]
    next[index] = ch.toUpperCase()
    props.onCharsChange(normalizeChars(props.kind, next))
  }

  function moveNext(from: number) {
    for (let i = from + 1; i < len; i++) {
      // 省份/字母优先由选择器填，允许跳过到序号区
      if (i === 0 || i === 1) continue
      setActiveIndex(i)
      return
    }
    setActiveIndex(len - 1)
  }

  function movePrev(from: number) {
    for (let i = from - 1; i >= 0; i--) {
      if (i === 0 || i === 1) continue
      setActiveIndex(i)
      return
    }
    setActiveIndex(2)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const k = e.key
    if (k === 'Tab') return
    if (k === 'Enter') return

    if (k === 'Backspace') {
      e.preventDefault()
      if (cells[activeIndex]) {
        patchAt(activeIndex, '')
      } else {
        movePrev(activeIndex)
      }
      return
    }

    if (k.length === 1) {
      const ch = k.toUpperCase()
      e.preventDefault()
      if (!isValidChar(props.kind, activeIndex, ch)) return
      patchAt(activeIndex, ch)
      moveNext(activeIndex)

      // 若用户输入绿牌但选错了大小型，尝试智能纠正（不打断输入）
      if (props.kind !== 'blue') {
        const inferred = tryInferGreenKind([...cells.slice(0, activeIndex), ch, ...cells.slice(activeIndex + 1)])
        if (inferred && inferred !== props.kind) props.onKindChange(inferred)
      }
    }
  }

  function inputChar(ch: string) {
    const c = (ch || '').toUpperCase()
    if (!isValidChar(props.kind, activeIndex, c)) return
    patchAt(activeIndex, c)
    moveNext(activeIndex)
  }

  function doBackspace() {
    if (cells[activeIndex]) {
      patchAt(activeIndex, '')
    } else {
      movePrev(activeIndex)
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const raw = e.clipboardData.getData('text')
    const t = cleanText(raw)
    if (!t) return
    e.preventDefault()

    // 只支持蓝牌7位、绿牌8位
    const assumedKind: PlateKind =
      t.length === 7 ? 'blue' : t.length === 8 ? (tryInferGreenKind(t.split('')) ?? props.kind) : props.kind
    props.onKindChange(assumedKind)

    const targetLen = lengthOf(assumedKind)
    const base = defaultChars(assumedKind)
    for (let i = 0; i < Math.min(targetLen, t.length); i++) {
      base[i] = t[i]
    }
    props.onCharsChange(normalizeChars(assumedKind, base))
    focusTyping(Math.min(2, targetLen - 1))
  }

  function setKind(nextKind: PlateKind) {
    setOpenKind(false)
    setKeypadOpen(false)
    if (nextKind === props.kind) return
    // 尽量保留前两位（省/字母），其余清空
    const next = defaultChars(nextKind)
    next[0] = props.chars[0] || ''
    next[1] = props.chars[1] || ''
    // 绿牌必有车型字母位：默认 D（纯电）
    if (nextKind === 'green_small') next[2] = 'D'
    if (nextKind === 'green_large') next[7] = 'D'
    props.onKindChange(nextKind)
    props.onCharsChange(normalizeChars(nextKind, next))
    focusTyping(2)
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-[1500] pb-[max(env(safe-area-inset-bottom),10px)]">
        {/* 点击输入：真实场景的 0-9/字母键盘 */}
        {keypadOpen ? (
          <Keypad
            kind={props.kind}
            activeIndex={activeIndex}
            onInput={inputChar}
            onBackspace={doBackspace}
            onClose={() => setKeypadOpen(false)}
          />
        ) : null}

        <div className="mx-auto w-full max-w-[420px] px-4">
          <div className="glass-card flex items-center gap-3 rounded-full px-3 py-2">
            <button
              className={clsx(
                'rounded-full px-3 py-2 text-[12px] font-semibold shadow-[0_10px_20px_-15px_rgba(0,0,0,0.35)] whitespace-nowrap',
                typeBtnClass(props.kind),
              )}
              onClick={() => setOpenKind(true)}
            >
              {typeBtnText(props.kind)}
            </button>

            <div
              ref={barRef}
              className="flex flex-1 items-center gap-1"
              style={{ touchAction: 'pan-y' }}
              onPointerDown={(e) => {
                // 仅对序号区做手势切换（更符合真实输入习惯）
                const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
                const btn = el?.closest?.('[data-plate-index]') as HTMLElement | null
                const idx = btn ? Number(btn.dataset.plateIndex) : NaN
                if (!Number.isFinite(idx) || idx < 2) return
                setDragging(true)
                focusTyping(idx)
                setKeypadOpen(true)
                barRef.current?.setPointerCapture?.(e.pointerId)
              }}
              onPointerMove={(e) => {
                if (!dragging) return
                const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
                const btn = el?.closest?.('[data-plate-index]') as HTMLElement | null
                const idx = btn ? Number(btn.dataset.plateIndex) : NaN
                if (!Number.isFinite(idx) || idx < 2) return
                if (idx !== activeIndex) focusTyping(idx)
              }}
              onPointerUp={() => setDragging(false)}
              onPointerCancel={() => setDragging(false)}
              onPointerLeave={() => setDragging(false)}
            >
              {cells.map((c, i) => {
                const isActive = i === activeIndex
                // 只保留一个“数字提示”，避免空位全是 0
                const label =
                  c || (i >= 2 && isActive ? '0' : placeholder(props.kind, i))
                return (
                  <button
                    key={i}
                    data-plate-index={i}
                    className={clsx(
                      'grid h-9 w-7 place-items-center rounded-[10px] text-[13px] font-semibold',
                      'bg-white/50 shadow-[0_8px_16px_-14px_rgba(0,0,0,0.45)] transition-all duration-150',
                      isActive && 'ring-2 ring-black/20 scale-[1.08] bg-white/70',
                    )}
                    onClick={() => {
                      if (i === 0) return setOpenProvince(true)
                      if (i === 1) return setOpenLetter(true)
                      focusTyping(i)
                      setKeypadOpen(true)
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 隐藏输入：用于键盘录入与粘贴 */}
          <input
            ref={inputRef}
            value=""
            onChange={() => {}}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            inputMode="text"
            autoCapitalize="characters"
            className="absolute -z-10 h-0 w-0 opacity-0"
          />
        </div>
      </div>

      <Sheet open={openKind} title="选择车牌类型" onClose={() => setOpenKind(false)}>
        <div className="grid gap-2">
          {(
            [
              { k: 'blue', t: '蓝牌（普通）' },
              { k: 'green_small', t: '绿牌（小型新能源）' },
              { k: 'green_large', t: '绿牌（大型新能源）' },
            ] as const
          ).map((x) => (
            <button
              key={x.k}
              className={clsx(
                'glass-card flex w-full items-center justify-between px-4 py-4 text-left',
                'rounded-[20px] shadow-[0_14px_30px_-22px_rgba(0,0,0,0.45)]',
              )}
              onClick={() => setKind(x.k)}
            >
              <div className="text-[14px] font-semibold">{x.t}</div>
              <div className="text-[12px] text-black/45">点击切换</div>
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={openProvince} title="选择省份简称" onClose={() => setOpenProvince(false)}>
        <div className="grid grid-cols-6 gap-2">
          {PROVINCES.map((p) => (
            <button
              key={p}
              className={clsx(
                'grid h-11 place-items-center rounded-[16px] bg-white/70 font-semibold',
                'shadow-[0_12px_26px_-20px_rgba(0,0,0,0.45)]',
              )}
              onClick={() => {
                patchAt(0, p)
                setOpenProvince(false)
                if (!cells[1]) {
                  // 等待 Sheet 关闭后再打开，避免部分机型 focus 失效
                  requestAnimationFrame(() => setOpenLetter(true))
                } else {
                  requestAnimationFrame(() => focusTyping(2))
                }
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={openLetter} title="选择发牌字母" onClose={() => setOpenLetter(false)}>
        <div className="grid grid-cols-7 gap-2">
          {LETTERS.map((p) => (
            <button
              key={p}
              className={clsx(
                'grid h-11 place-items-center rounded-[16px] bg-white/70 font-semibold',
                'shadow-[0_12px_26px_-20px_rgba(0,0,0,0.45)]',
              )}
              onClick={() => {
                patchAt(1, p)
                setOpenLetter(false)
                requestAnimationFrame(() => focusTyping(2))
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}
