import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PlatePreview from '../components/PlatePreview'
import { kindLabel } from '../lib/plate'
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
  const [mode, setMode] = useState<'stack' | 'list'>('stack')

  useEffect(() => {
    const t = requestAnimationFrame(() => setExpanded(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const deckHeight = useMemo(() => {
    // 让牌堆展开更明显：每张露出下方约 10%-20%
    const base = 360
    const step = 46
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
                  className="rounded-full bg-black/5 px-3 py-2 text-[12px] font-semibold text-[color:var(--app-text)]"
                  onClick={() => setMode((m) => (m === 'stack' ? 'list' : 'stack'))}
                  aria-label="切换展示方式"
                >
                  {mode === 'stack' ? '全面展开' : '收起堆叠'}
                </button>
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
                <div className="mt-2 text-[13px] text-[color:var(--app-subtext)]">去首页生成一个「牌没有问题！」</div>
                <button
                  className="mt-6 rounded-full bg-black px-5 py-3 text-[13px] font-semibold text-white"
                  onClick={() => nav('/')}
                >
                  回到首页
                </button>
              </div>
            ) : (
              <div className="px-5 pb-7">
                <div className="text-[12px] text-[color:var(--app-subtext)]">
                  {mode === 'stack' ? '像打牌一样展开（仅浏览，不回填）' : '列表模式（仅浏览，不回填）'}
                </div>

                {mode === 'list' ? (
                  <div className="mt-4 space-y-3 overflow-auto pr-1" style={{ maxHeight: deckHeight }}>
                    {items.map((it) => (
                      <div key={it.id} className="solid-card px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[13px] font-semibold tracking-tight">{kindLabel(it.kind)}</div>
                            <div className="mt-1 text-[12px] text-[color:var(--app-subtext)]">{formatTime(it.createdAt)}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              className="text-[12px] font-semibold text-[color:var(--app-subtext)] disabled:opacity-40"
                              disabled={!it.sealed}
                              onClick={() => nav(`/share/${it.id}`)}
                            >
                              分享
                            </button>
                            <button
                              className="text-[12px] font-semibold text-[color:var(--app-subtext)]"
                              onClick={() => {
                                removeHistory(it.id)
                                setItems(loadHistory())
                              }}
                            >
                              删除
                            </button>
                          </div>
                        </div>
                        <div className="mt-3">
                          <PlatePreview kind={it.kind} chars={it.chars} sealed={it.sealed ?? true} className="w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 overflow-auto pr-1" style={{ height: deckHeight }}>
                    <div className="relative mx-auto w-full" style={{ height: deckHeight }}>
                      {items.map((it, idx) => {
                        // 堆叠：同方向倾斜（更干净），避免“乱七八糟多层”
                        const rot = expanded ? idx * 2.4 : idx * 0.8
                        const y = expanded ? idx * 46 : idx * 10
                        const x = expanded ? idx * 2 : 0
                        const scale = expanded ? 1 : 0.99
                        const z = items.length - idx

                        return (
                          <div
                            key={it.id}
                            className="absolute left-0 right-0 mx-auto w-full select-none text-left"
                            style={{
                              zIndex: z,
                              transform: `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg) scale(${scale})`,
                              transition:
                                'transform 520ms cubic-bezier(0.2, 0.9, 0.2, 1), filter 520ms cubic-bezier(0.2, 0.9, 0.2, 1)',
                              filter: expanded ? 'drop-shadow(0 22px 28px rgba(0,0,0,0.12))' : 'none',
                            }}
                            onClick={() => setMode('list')}
                          >
                            <div className="solid-card relative px-4 py-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-[13px] font-semibold tracking-tight">{kindLabel(it.kind)}</div>
                                  <div className="mt-1 text-[12px] text-[color:var(--app-subtext)]">{formatTime(it.createdAt)}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    className="text-[12px] font-semibold text-[color:var(--app-subtext)] disabled:opacity-40"
                                    disabled={!it.sealed}
                                    onClick={(e) => {
                                      // 避免触发“展开全部”
                                      e.stopPropagation()
                                      nav(`/share/${it.id}`)
                                    }}
                                  >
                                    分享
                                  </button>
                                  <button
                                    className="text-[12px] font-semibold text-[color:var(--app-subtext)]"
                                    onClick={(e) => {
                                      // 避免触发“展开全部”
                                      e.stopPropagation()
                                      removeHistory(it.id)
                                      setItems(loadHistory())
                                    }}
                                  >
                                    删除
                                  </button>
                                </div>
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
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
