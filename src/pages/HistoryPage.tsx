import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PlatePreview from '../components/PlatePreview'
import { displayText, kindLabel } from '../lib/plate'
import { clearHistory, loadHistory, removeHistory, type HistoryItem } from '../lib/storage'

function formatTime(ts: number) {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function HistoryPage() {
  const nav = useNavigate()
  const [items, setItems] = useState<HistoryItem[]>(() => loadHistory())

  const empty = useMemo(() => items.length === 0, [items])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setExpanded(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const deckHeight = useMemo(() => {
    // 让牌堆展开更明显：每张露出下方约 10%-20%
    const base = 320
    const step = 42
    const h = base + Math.max(0, items.length - 1) * step
    return Math.min(920, h)
  }, [items.length])

  return (
    <div className="fixed inset-0 z-50">
      {/* dim */}
      <button
        className="absolute inset-0 bg-black/20"
        aria-label="关闭历史"
        onClick={() => nav(-1)}
      />

      {/* bottom sheet */}
      <div className="absolute inset-x-0 bottom-0 pb-[max(env(safe-area-inset-bottom),12px)]">
        <div className="mx-auto w-full max-w-[420px] px-4">
          <div
            className="glass-card max-h-[86vh] overflow-hidden rounded-[30px] transition-transform duration-500 ease-out"
            style={{ transform: expanded ? 'translateY(0)' : 'translateY(24px)' }}
          >
            <div className="flex items-center justify-between px-5 py-4">
              <div className="text-[15px] font-semibold tracking-tight">查看历史</div>
              <div className="flex items-center gap-2">
                <button
                  className="icon-btn h-9 w-9"
                  onClick={() => {
                    clearHistory()
                    setItems([])
                  }}
                  aria-label="清空"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 6h18M8 6V4h8v2m-7 4v8m6-8v8M6 6l1 16h10l1-16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button className="icon-btn h-9 w-9" onClick={() => nav(-1)} aria-label="关闭">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {empty ? (
              <div className="px-6 pb-8 text-center">
                <div className="text-[16px] font-semibold">还没有历史记录</div>
                <div className="mt-2 text-[13px] text-black/45">去首页生成一个「牌没有问题！」</div>
                <button
                  className="mt-6 rounded-full bg-black px-5 py-3 text-[13px] font-semibold text-white"
                  onClick={() => nav('/')}
                >
                  回到首页
                </button>
              </div>
            ) : (
              <div className="px-5 pb-7">
                <div className="text-[12px] text-black/45">像打牌一样展开，点任意一张回填</div>

                <div className="mt-4 overflow-auto pr-1" style={{ height: deckHeight }}>
                  <div className="relative mx-auto w-full" style={{ height: deckHeight }}>
                    {items.map((it, idx) => {
                      const n = items.length
                      const center = (n - 1) / 2
                      const rot = (idx - center) * 2.6
                      const y = expanded ? idx * 42 : idx * 10
                      const x = expanded ? (idx - center) * 6 : 0
                      const scale = expanded ? 1 : 0.985
                      const z = n - idx

                      return (
                        <div
                          key={it.id}
                          role="button"
                          tabIndex={0}
                          className="absolute left-0 right-0 mx-auto w-full cursor-pointer select-none text-left"
                          style={{
                            zIndex: z,
                            transform: `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg) scale(${scale})`,
                            transition:
                              'transform 520ms cubic-bezier(0.2, 0.9, 0.2, 1), filter 520ms cubic-bezier(0.2, 0.9, 0.2, 1)',
                            filter: expanded ? 'drop-shadow(0 22px 28px rgba(0,0,0,0.12))' : 'none',
                          }}
                          onClick={() => nav('/', { state: { kind: it.kind, chars: it.chars, fromHistory: true } })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') nav('/', { state: { kind: it.kind, chars: it.chars, fromHistory: true } })
                          }}
                        >
                          {/* 模板堆叠效果 */}
                          <div className="relative">
                            <div className="absolute -left-2 top-3 h-[150px] w-[92%] rotate-[-8deg] rounded-[26px] bg-white/40 shadow-[0_26px_60px_-44px_rgba(0,0,0,0.55)] backdrop-blur-xl" />
                            <div className="absolute -right-3 top-2 h-[150px] w-[90%] rotate-[7deg] rounded-[26px] bg-white/45 shadow-[0_26px_60px_-44px_rgba(0,0,0,0.55)] backdrop-blur-xl" />
                            <div className="glass-card relative px-4 py-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-[14px] font-semibold tracking-tight">
                                    {displayText(it.kind, it.chars)}
                                  </div>
                                  <div className="mt-1 text-[12px] text-black/45">
                                    {kindLabel(it.kind)} · {formatTime(it.createdAt)}
                                  </div>
                                </div>
                                <button
                                  className="text-[12px] font-semibold text-black/40"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeHistory(it.id)
                                    setItems(loadHistory())
                                  }}
                                >
                                  删除
                                </button>
                              </div>

                              <div className="mt-3">
                                <PlatePreview
                                  kind={it.kind}
                                  chars={it.chars}
                                  sealed={it.sealed ?? true}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
