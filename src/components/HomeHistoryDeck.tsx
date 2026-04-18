import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { displayText, kindLabel } from '../lib/plate'
import { loadHistory, type HistoryItem } from '../lib/storage'
import PlatePreview from './PlatePreview'

export default function HomeHistoryDeck(props: {
  max?: number
  onEmptyClick?: () => void
}) {
  const nav = useNavigate()
  const items = useMemo<HistoryItem[]>(() => loadHistory().slice(0, props.max ?? 6), [props.max])
  // 用“顺序数组”做循环切换：下一张=把最上面的移到最底下
  const [order, setOrder] = useState<string[]>([])
  const [anim, setAnim] = useState<null | { dir: 'next' | 'prev'; phase: 'lift' | 'move' | 'drop'; movingId: string }>(null)
  const drag = useRef<{ x: number; active: boolean } | null>(null)
  const moveTimer = useRef<number | null>(null)
  const dropTimer = useRef<number | null>(null)
  const LIFT_MS = 240
  const MOVE_MS = 520
  const DROP_MS = 140

  if (items.length === 0) {
    return (
      <button
        className="glass-card mt-5 w-full px-5 py-5 text-left"
        onClick={props.onEmptyClick}
      >
        <div className="text-[13px] font-semibold text-black/60">历史车牌</div>
        <div className="mt-1 text-[12px] text-black/45">还没有验过牌，点这里试试</div>
      </button>
    )
  }

  // items 变化时重置顺序
  useEffect(() => {
    setOrder(items.map((x) => x.id))
    setAnim(null)
    if (moveTimer.current) window.clearTimeout(moveTimer.current)
    if (dropTimer.current) window.clearTimeout(dropTimer.current)
    moveTimer.current = null
    dropTimer.current = null
  }, [items.length])

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (moveTimer.current) window.clearTimeout(moveTimer.current)
      if (dropTimer.current) window.clearTimeout(dropTimer.current)
    }
  }, [])

  const mapById = useMemo(() => new Map(items.map((x) => [x.id, x])), [items])
  const ordered = useMemo(() => {
    if (order.length === 0) return items
    const arr = order.map((id) => mapById.get(id)).filter(Boolean) as HistoryItem[]
    // 容错：有新增/删除时，补齐未在 order 中的项
    const rest = items.filter((x) => !order.includes(x.id))
    return [...arr, ...rest]
  }, [items, mapById, order])

  const n = ordered.length
  const center = (n - 1) / 2

  function applyNext() {
    if (n <= 1 || anim) return
    const movingId = order[0] ?? ordered[0]?.id
    if (!movingId) return
    setAnim({ dir: 'next', phase: 'lift', movingId })
    if (moveTimer.current) window.clearTimeout(moveTimer.current)
    if (dropTimer.current) window.clearTimeout(dropTimer.current)
    moveTimer.current = window.setTimeout(() => setAnim((a) => (a ? { ...a, phase: 'move' } : null)), LIFT_MS)
    dropTimer.current = window.setTimeout(() => setAnim((a) => (a ? { ...a, phase: 'drop' } : null)), LIFT_MS + MOVE_MS)
  }

  function applyPrev() {
    if (n <= 1 || anim) return
    const movingId = order[order.length - 1] ?? ordered[n - 1]?.id
    if (!movingId) return
    setAnim({ dir: 'prev', phase: 'lift', movingId })
    if (moveTimer.current) window.clearTimeout(moveTimer.current)
    if (dropTimer.current) window.clearTimeout(dropTimer.current)
    moveTimer.current = window.setTimeout(() => setAnim((a) => (a ? { ...a, phase: 'move' } : null)), LIFT_MS)
    dropTimer.current = window.setTimeout(() => setAnim((a) => (a ? { ...a, phase: 'drop' } : null)), LIFT_MS + MOVE_MS)
  }

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between px-1">
        <div className="text-[13px] font-semibold text-black/60">历史车牌</div>
        <button className="text-[12px] font-semibold text-black/40" onClick={() => nav('/history')}>
          全部
        </button>
      </div>

      <div
        className="relative mt-3 h-[320px]"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, active: true }
        }}
        onPointerMove={(e) => {
          if (!drag.current?.active) return
          const dx = e.clientX - drag.current.x
          // 轻微反馈：左右拖动时给整体一点点倾斜（仅视觉，不改 offset）
          ;(e.currentTarget as HTMLDivElement).style.transform = `translateX(${dx * 0.08}px)`
        }}
        onPointerUp={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = ''
          const start = drag.current?.x ?? e.clientX
          drag.current = null
          const dx = e.clientX - start
          if (Math.abs(dx) < 40) return
          if (items.length <= 1) return
          // 向左滑：下一张（顶部移到底部）；向右滑：上一张（底部移到顶部）
          if (dx < 0) applyNext()
          else applyPrev()
        }}
        onPointerCancel={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.transform = ''
          drag.current = null
        }}
      >
        {/* 左右箭头：循环切换（一直可用，只有 1 张时隐藏） */}
        {items.length > 1 ? (
          <button
            className="icon-btn absolute left-0 top-1/2 z-[80] h-9 w-9 -translate-x-1/2 -translate-y-1/2"
            aria-label="上一个"
            onClick={(e) => {
              e.stopPropagation()
              applyPrev()
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
        {items.length > 1 ? (
          <button
            className="icon-btn absolute right-0 top-1/2 z-[80] h-9 w-9 translate-x-1/2 -translate-y-1/2"
            aria-label="下一个"
            onClick={(e) => {
              e.stopPropagation()
              applyNext()
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}

        {ordered.map((it, idx) => {
          // 更自然的“衔接”：
          // 1) lift：先把被切换的那张抬起一点（不换位）
          // 2) move：再让它从顶部移动到最后一张位置
          // 3) drop：最后阶段才改变 zIndex（像“塞进”牌堆底部）
          let targetIndex = idx
          if (anim?.phase === 'move' || anim?.phase === 'drop') {
            if (anim.dir === 'next') targetIndex = idx === 0 ? n - 1 : idx - 1
            else targetIndex = idx === n - 1 ? 0 : idx + 1
          }

          const rot = (targetIndex - center) * 2.6
          // 每张露出下方约 10%~20%
          const y = targetIndex * 28
          const x = (targetIndex - center) * 6
          let z = n - idx
          // 被切换的卡片：不同方向的 zIndex 策略（“下一个”和“上一个”相反）
          if (it.id === anim?.movingId) {
            if (anim.dir === 'next') {
              // 下一个：从顶部塞到最底层，move 开始就到最底
              if (anim.phase === 'move' || anim.phase === 'drop') z = 0
            } else {
              // 上一个：从底部抽到顶部
              // - lift：仍在底层（像从下面抽出来）
              // - move：已经抽出后应在最上层移动到顶部位置（否则会“看不到→突然冒出来”）
              // - drop：保持最上层落入牌堆
              if (anim.phase === 'lift') z = 0
              if (anim.phase === 'move' || anim.phase === 'drop') z = n + 10
            }
          }
          const canUse = !!it.sealed
          const isMoving = !!anim && it.id === anim.movingId

          // 抬起高度按牌堆高度动态增大：让“从第一张抬起→再塞到最后”更连贯
          const stackSpan = Math.max(0, (n - 1) * 28)
          const liftDyBase = Math.min(220, 90 + stackSpan)
          // 上一个：底牌从下往上“抽出”的抬起距离需要更大
          const liftDy = anim?.dir === 'prev' ? Math.min(360, liftDyBase * 2) : liftDyBase
          const liftDx = 8
          const lift =
            anim?.phase === 'lift' && isMoving
              ? anim.dir === 'next'
                ? ` translate3d(-${liftDx}px, -${liftDy}px, 0) scale(1.03)`
                : ` translate3d(${liftDx}px, -${liftDy}px, 0) scale(1.03)`
              : ''
          const drop = anim?.phase === 'drop' && isMoving ? ` translate3d(0, 8px, 0) scale(0.99)` : ''

          return (
            <div
              key={it.id}
              role="button"
              tabIndex={0}
              className="absolute left-0 right-0 mx-auto w-full cursor-pointer select-none text-left"
              style={{
                zIndex: z,
                transform: `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)${lift}${drop}`,
                transition:
                  anim?.phase === 'lift' && isMoving
                    ? `transform ${LIFT_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`
                    : anim?.phase === 'drop' && isMoving
                      ? `transform ${DROP_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
                      : `transform ${MOVE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
              }}
              onTransitionEnd={(e) => {
                if (e.propertyName !== 'transform') return
                if (!anim || !isMoving) return
                if (anim.phase !== 'drop') return
                setOrder((prev) => {
                  if (prev.length <= 1) return prev
                  if (anim.dir === 'next') return [...prev.slice(1), prev[0]]
                  return [prev[prev.length - 1], ...prev.slice(0, -1)]
                })
                requestAnimationFrame(() => setAnim(null))
              }}
              onClick={() => {
                if (!canUse) {
                  props.onEmptyClick?.()
                  return
                }
                nav('/', { state: { kind: it.kind, chars: it.chars, fromHistory: true } })
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') nav('/', { state: { kind: it.kind, chars: it.chars, fromHistory: true } })
              }}
            >
              <div className="glass-card px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[14px] font-semibold tracking-tight">{displayText(it.kind, it.chars)}</div>
                    <div className="mt-1 text-[12px] text-black/45">{kindLabel(it.kind)}</div>
                  </div>
                  {!canUse ? (
                    <div className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-semibold text-black/45">
                      未验过
                    </div>
                  ) : null}
                </div>

                <div className="mt-3">
                  <PlatePreview kind={it.kind} chars={it.chars} sealed={it.sealed ?? true} className="w-full" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
