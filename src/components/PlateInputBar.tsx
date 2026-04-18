import { clsx } from 'clsx'
import { useMemo, useRef, useState } from 'react'
import type { PlateChars, PlateKind } from '../lib/plate'
import {
  HK_LETTERS,
  LETTERS,
  PROVINCES,
  defaultChars,
  isValidChar,
  kindLabel,
  lengthOf,
  lockedChar,
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
  if (kind === 'green_small' || kind === 'green_large') return 'bg-gradient-to-b from-[#20d66f] to-[#0fae55] text-white'
  if (kind === 'moto') return 'bg-[#f5c233] text-[#0b0b10]'
  // FV/FU/FT：后牌黄底（纯色），与模拟器一致
  if (kind === 'fv' || kind === 'fu' || kind === 'ft') return 'bg-[#f5c233] text-black'
  // 避免夜间模式下 text-black 被全局兜底规则改色
  if (kind === 'tw') return 'bg-white text-[#0b0b10] border border-black/20'
  if (kind === 'hk') return 'bg-black text-white'
  if (kind === 'mo') return 'bg-black text-white'
  return 'bg-black text-white'
}

function typeBtnText(kind: PlateKind) {
  if (kind === 'blue') return '蓝'
  if (kind === 'green_small' || kind === 'green_large') return '绿'
  if (kind === 'moto') return '摩'
  if (kind === 'hk') return '港'
  if (kind === 'mo') return '澳'
  if (kind === 'tw') return '台'
  if (kind === 'yuez_hk' || kind === 'yuez_mo') return '粤Z'
  if (kind === 'fv') return 'FV'
  if (kind === 'fu') return 'FU'
  return 'FT'
}

function placeholder(kind: PlateKind, i: number) {
  const locked = lockedChar(kind, i)
  if (locked) return locked

  if (kind === 'blue' || kind === 'green_small' || kind === 'green_large') {
    if (i === 0) return '省'
    if (i === 1) return 'A'
  }
  if (kind === 'moto') {
    if (i === 0) return '省'
    if (i === 1) return 'A'
  }
  if (kind === 'hk') {
    if (i === 0 || i === 1) return 'A'
  }
  if (kind === 'mo') {
    if (i === 1) return 'A'
  }
  if (kind === 'tw') {
    if (i >= 0 && i <= 2) return 'A'
  }
  if (kind === 'blue') return '·'
  if (kind === 'green_small') {
    if (i === 2) return 'D'
    return '·'
  }
  if (kind === 'green_large') {
    if (i === 7) return 'D'
    return '·'
  }
  if (kind === 'hk' || kind === 'mo' || kind === 'fv' || kind === 'fu' || kind === 'ft' || kind === 'yuez_hk' || kind === 'yuez_mo') {
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
  const [letterTargetIndex, setLetterTargetIndex] = useState<number>(1)

  const len = lengthOf(props.kind)
  const cells = useMemo(() => {
    const base = Array.from({ length: len }, (_, i) => props.chars[i] || '')
    return base
  }, [props.chars, len])

  function focusTyping(index = activeIndex) {
    const safeIndex = Math.max(0, Math.min(index, len - 1))
    setActiveIndex(safeIndex)
    // 不主动触发系统软键盘：输入只通过我们自己的面板(Keypad)
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
    const next = defaultChars(nextKind)
    // 仅在普通内地牌之间切换时保留“省/字母”
    const isCn = (k: PlateKind) => k === 'blue' || k === 'green_small' || k === 'green_large'
    if (isCn(props.kind) && isCn(nextKind)) {
      next[0] = props.chars[0] || next[0]
      next[1] = props.chars[1] || next[1]
    }
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
          <div className="toolbar-card flex items-center gap-3 px-3 py-2">
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
                if (!Number.isFinite(idx)) return
                if (lockedChar(props.kind, idx)) return

                // 省份/字母位：只弹出选择面板，不打开数字键盘
                if (
                  props.kind === 'blue' ||
                  props.kind === 'green_small' ||
                  props.kind === 'green_large' ||
                  props.kind === 'moto'
                ) {
                  if (idx === 0) return setOpenProvince(true)
                  if (idx === 1) {
                    setLetterTargetIndex(1)
                    return setOpenLetter(true)
                  }
                }
                if (props.kind === 'hk') {
                  // 港牌允许纯数字，不强制弹字母面板：直接打开自定义键盘
                }
                if (props.kind === 'mo') {
                  if (idx === 1) {
                    setLetterTargetIndex(1)
                    return setOpenLetter(true)
                  }
                }
                if (props.kind === 'tw') {
                  if (idx >= 0 && idx <= 2) {
                    setLetterTargetIndex(idx)
                    return setOpenLetter(true)
                  }
                }

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
                if (lockedChar(props.kind, idx)) return
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
                      // 保持圆形，避免绿牌/多模板时形状被挤变形
                      'grid h-9 w-9 place-items-center rounded-full text-[13px] font-semibold',
                      'bg-white/50 shadow-[0_8px_16px_-14px_rgba(0,0,0,0.45)] transition-all duration-150',
                      isActive && 'ring-2 ring-black/20 scale-[1.08] bg-white/70',
                      lockedChar(props.kind, i) && 'bg-black/10 text-black/60 ring-0 scale-100',
                    )}
                    onClick={() => {
                      if (lockedChar(props.kind, i)) return
                      if (
                        props.kind === 'blue' ||
                        props.kind === 'green_small' ||
                        props.kind === 'green_large' ||
                        props.kind === 'moto'
                      ) {
                        if (i === 0) return setOpenProvince(true)
                        if (i === 1) {
                          setLetterTargetIndex(1)
                          return setOpenLetter(true)
                        }
                      }
                      if (props.kind === 'hk') {
                        // 港牌允许纯数字，不强制弹字母面板：直接打开自定义键盘
                      }
                      if (props.kind === 'mo') {
                        if (i === 1) {
                          setLetterTargetIndex(1)
                          return setOpenLetter(true)
                        }
                      }
                      if (props.kind === 'tw') {
                        if (i >= 0 && i <= 2) {
                          setLetterTargetIndex(i)
                          return setOpenLetter(true)
                        }
                      }
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

          <div className="mt-2 px-2 text-center text-[11px] text-[color:var(--app-subtext)]">
            开放源代码：
            <a
              href="https://github.com/2winter-dev/yaoyanpai"
              target="_blank"
              rel="noreferrer"
              className="ml-1 font-semibold text-[color:var(--app-text)] underline decoration-black/20 underline-offset-2"
            >
              https://github.com/2winter-dev/yaoyanpai
            </a>
            <span className="mx-2 opacity-40">·</span>
            <a
              href="https://baike.baidu.com/item/%E8%BD%A6%E7%89%8C/8347320"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[color:var(--app-text)] underline decoration-black/20 underline-offset-2"
            >
              车牌规则
            </a>
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
              { k: 'blue', t: kindLabel('blue') },
              { k: 'green_small', t: kindLabel('green_small') },
              { k: 'green_large', t: kindLabel('green_large') },
              { k: 'moto', t: kindLabel('moto') },
              { k: 'yuez_hk', t: kindLabel('yuez_hk') },
              { k: 'yuez_mo', t: kindLabel('yuez_mo') },
              { k: 'fv', t: kindLabel('fv') },
              { k: 'fu', t: kindLabel('fu') },
              { k: 'ft', t: kindLabel('ft') },
              { k: 'hk', t: kindLabel('hk') },
              { k: 'mo', t: kindLabel('mo') },
              { k: 'tw', t: kindLabel('tw') },
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
              <div className="text-[12px] text-black/45">切换</div>
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
                'kbd-option grid h-11 place-items-center rounded-[16px] font-semibold',
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
          {(props.kind === 'hk' || props.kind === 'mo' ? HK_LETTERS : LETTERS).map((p) => (
            <button
              key={p}
              className={clsx(
                'kbd-option grid h-11 place-items-center rounded-[16px] font-semibold',
                'shadow-[0_12px_26px_-20px_rgba(0,0,0,0.45)]',
              )}
              onClick={() => {
                patchAt(letterTargetIndex, p)
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
