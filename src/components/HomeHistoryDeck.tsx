import { useMemo } from 'react'
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

  const n = items.length
  const center = (n - 1) / 2

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between px-1">
        <div className="text-[13px] font-semibold text-black/60">历史车牌</div>
        <button className="text-[12px] font-semibold text-black/40" onClick={() => nav('/history')}>
          全部
        </button>
      </div>

      <div className="relative mt-3 h-[240px]">
        {items.map((it, idx) => {
          const rot = (idx - center) * 2.6
          const y = idx * 14
          const x = (idx - center) * 3
          const z = n - idx
          const canUse = !!it.sealed

          return (
            <div
              key={it.id}
              role="button"
              tabIndex={0}
              className="absolute left-0 right-0 mx-auto w-full cursor-pointer select-none text-left"
              style={{
                zIndex: z,
                transform: `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`,
                transition: 'transform 420ms cubic-bezier(0.2, 0.9, 0.2, 1)',
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

