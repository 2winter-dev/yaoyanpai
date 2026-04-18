import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import HomeHistoryDeck from '../components/HomeHistoryDeck'
import PlateInputBar from '../components/PlateInputBar'
import PlatePreview from '../components/PlatePreview'
import type { PlateChars, PlateKind } from '../lib/plate'
import { defaultChars, validatePlate } from '../lib/plate'
import { addHistory } from '../lib/storage'
import Sheet from '../components/Sheet'
import { applyThemeMode, getStoredThemeMode, setStoredThemeMode, type ThemeMode } from '../lib/theme'

export default function HomePage() {
  const nav = useNavigate()
  const loc = useLocation()
  const [kind, setKind] = useState<PlateKind>('blue')
  const [chars, setChars] = useState<PlateChars>(() => defaultChars('blue'))
  const [plateAnimKey, setPlateAnimKey] = useState<number>(0)
  const prevOk = useRef(false)
  const prevKind = useRef<PlateKind>('blue')
  const [toast, setToast] = useState('')
  const [themeOpen, setThemeOpen] = useState(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredThemeMode())

  useEffect(() => {
    const st = loc.state as undefined | { kind?: PlateKind; chars?: PlateChars }
    if (!st?.kind || !st?.chars) return
    setKind(st.kind)
    setChars(st.chars)
    setPlateAnimKey(Date.now())
    // 清理 state，避免返回时反复回填
    window.history.replaceState(null, '')
  }, [loc.state])

  useEffect(() => {
    // kind 切换时：默认用该模板的默认牌；仅普通内地牌之间切换保留“省/字母”
    setChars((prev) => {
      const next = defaultChars(kind)
      const isCn = (k: PlateKind) => k === 'blue' || k === 'green_small' || k === 'green_large'
      if (isCn(prevKind.current) && isCn(kind)) {
        next[0] = prev[0] || next[0]
        next[1] = prev[1] || next[1]
      }
      return next
    })
    prevKind.current = kind
  }, [kind])

  const v = useMemo(() => validatePlate(kind, chars), [kind, chars])
  const themeClass = ''

  useEffect(() => {
    if (v.ok && !prevOk.current) setPlateAnimKey(Date.now())
    prevOk.current = v.ok
  }, [v.ok])

  return (
    <div className={`min-h-[100svh] pb-28 ${themeClass}`}>
      <div className="mx-auto w-full max-w-[420px] px-4 pt-6">
        <div className="relative flex items-center justify-center">
          <div className="app-title" aria-label="我要验牌模拟器">
            我要验（车）牌模拟器
          </div>

          {/* 右侧按钮（带更明显投影） */}
          <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-2">
            <button
              className="icon-btn shadow-[0_22px_45px_-30px_rgba(0,0,0,0.55)]"
              onClick={() => setThemeOpen(true)}
              aria-label="夜间模式"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 13.1A8 8 0 1 1 10.9 3 6.5 6.5 0 0 0 21 13.1Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className="icon-btn shadow-[0_22px_45px_-30px_rgba(0,0,0,0.55)]"
              onClick={() => nav('/history')}
              aria-label="查看历史"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8v5l3 2M3 12a9 9 0 1 0 3-6.708"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 4v4h4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 叠放卡片（对应设计稿的浮层效果） */}
        <div className="relative mt-7">
          <div className="stack-back-1 absolute -right-3 top-6 w-[88%] rotate-[6deg] rounded-[26px] p-6 shadow-[0_26px_60px_-44px_rgba(0,0,0,0.55)]" />
          <div className="stack-back-2 absolute -left-2 top-10 w-[86%] -rotate-[8deg] rounded-[26px] p-6 shadow-[0_26px_60px_-44px_rgba(0,0,0,0.55)]" />

          <div className="glass-card relative overflow-hidden px-5 py-6">
            <div className="text-left text-[13px] font-semibold text-black/55">
              实时预览
            </div>
            <div className="mt-3">
              <div
                onClick={() => {
                  if (!v.ok) {
                    setToast('还没有验过牌')
                    window.setTimeout(() => setToast(''), 1400)
                  }
                }}
              >
                <PlatePreview kind={kind} chars={chars} animateKey={plateAnimKey} />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="text-left text-[12px] text-black/45">
                {v.ok ? '格式正确，可以生成分享卡片' : v.reason}
              </div>
              <button
                className="rounded-full bg-black px-4 py-2 text-[13px] font-semibold text-white shadow-[0_18px_30px_-18px_rgba(0,0,0,0.75)] disabled:opacity-40"
                disabled={!v.ok}
                onClick={() => {
                  if (!v.ok) return
                  const item = addHistory({ kind, chars, sealed: true })
                  nav(`/share/${item.id}`)
                }}
              >
                牌没有问题！
              </button>
            </div>

            {/* FV/FU/FT：黄底后牌提示 */}
            {kind === 'fv' || kind === 'fu' || kind === 'ft' ? (
              <div className="mt-3 text-left text-[12px] text-[color:var(--app-subtext)]">
                备注：FV / FU / FT 默认展示为后牌（黄底黑字）
              </div>
            ) : null}
          </div>
        </div>

        <HomeHistoryDeck
          max={6}
          onEmptyClick={() => {
            setToast('还没有验过牌')
            window.setTimeout(() => setToast(''), 1400)
          }}
        />

        <div className="relative -z-10 mt-6 px-1 text-[12px] leading-relaxed text-[color:var(--app-subtext)]">
          使用提示：点击底部输入位打开面板（数字/字母可切换）
        </div>
      </div>

      {toast ? (
        <div className="fixed inset-x-0 bottom-[96px] z-[1200]">
          <div className="mx-auto w-full max-w-[420px] px-4">
            <div className="mx-auto w-fit rounded-full bg-black/80 px-4 py-2 text-[12px] font-semibold text-white shadow-[0_20px_40px_-25px_rgba(0,0,0,0.75)]">
              {toast}
            </div>
          </div>
        </div>
      ) : null}

      <PlateInputBar
        kind={kind}
        chars={chars}
        onKindChange={setKind}
        onCharsChange={setChars}
      />

      <Sheet open={themeOpen} title="夜间模式" onClose={() => setThemeOpen(false)}>
        <div className="grid gap-2">
          {(
            [
              { k: 'auto', t: 'Auto（跟随系统）' },
              { k: 'light', t: 'Light（浅色）' },
              { k: 'dark', t: 'Dark（深色）' },
            ] as const
          ).map((x) => (
            <button
              key={x.k}
              className="glass-card flex w-full items-center justify-between rounded-[20px] px-4 py-4 text-left shadow-[0_14px_30px_-22px_rgba(0,0,0,0.45)]"
              onClick={() => {
                setThemeMode(x.k)
                setStoredThemeMode(x.k)
                applyThemeMode(x.k)
                setThemeOpen(false)
              }}
            >
              <div className="text-[14px] font-semibold">{x.t}</div>
              <div className="text-[12px] text-black/45">{themeMode === x.k ? '已选' : ''}</div>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  )
}
