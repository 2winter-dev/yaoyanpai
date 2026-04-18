import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import HomeHistoryDeck from '../components/HomeHistoryDeck'
import PlateInputBar from '../components/PlateInputBar'
import PlatePreview from '../components/PlatePreview'
import type { PlateChars, PlateKind } from '../lib/plate'
import { defaultChars, validatePlate } from '../lib/plate'
import { addHistory } from '../lib/storage'
import logoPng from '../assets/logo.png'

export default function HomePage() {
  const nav = useNavigate()
  const loc = useLocation()
  const [kind, setKind] = useState<PlateKind>('blue')
  const [chars, setChars] = useState<PlateChars>(() => ['粤', 'L', '0', '4', '0', '1', '8'])
  const [plateAnimKey, setPlateAnimKey] = useState<number>(0)
  const prevOk = useRef(false)
  const [toast, setToast] = useState('')

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
    // kind 切换时，保证 chars 长度正确且保留前两位
    setChars((prev) => {
      const next = defaultChars(kind)
      next[0] = prev[0] || ''
      next[1] = prev[1] || ''
      for (let i = 2; i < Math.min(prev.length, next.length); i++) next[i] = prev[i] || ''

      // 绿牌必有车型字母位：未填时默认给 D，避免“全数字输入但按钮不亮”的困惑
      if (kind === 'green_small' && !next[2]) next[2] = 'D'
      if (kind === 'green_large' && !next[7]) next[7] = 'D'
      return next
    })
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
        <div className="flex items-center gap-4">
          <div className="h-[84px] w-[84px] overflow-hidden rounded-full bg-white shadow-[0_26px_55px_-38px_rgba(0,0,0,0.45)]">
            <img src={logoPng} alt="我要验牌" className="h-full w-full object-contain" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[18px] font-medium text-black/70">嗨，朋友！</div>
              <button className="icon-btn" onClick={() => nav('/history')} aria-label="查看历史">
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
            <div className="mt-1 text-[26px] font-semibold leading-[1.1] tracking-tight">想验啥牌？</div>
          </div>
        </div>

        {/* 叠放卡片（对应设计稿的浮层效果） */}
        <div className="relative mt-7">
          <div className="absolute -right-3 top-6 w-[88%] rotate-[6deg] rounded-[26px] bg-white/55 p-6 shadow-[0_26px_60px_-44px_rgba(0,0,0,0.55)] backdrop-blur-xl" />
          <div className="absolute -left-2 top-10 w-[86%] -rotate-[8deg] rounded-[26px] bg-white/45 p-6 shadow-[0_26px_60px_-44px_rgba(0,0,0,0.55)] backdrop-blur-xl" />

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
          </div>
        </div>

        <HomeHistoryDeck
          max={6}
          onEmptyClick={() => {
            setToast('还没有验过牌')
            window.setTimeout(() => setToast(''), 1400)
          }}
        />

        <div className="mt-6 px-1 text-[12px] leading-relaxed text-black/45">
          小提示：先选省份简称与发牌字母，再用键盘输入后面的序号；也支持直接粘贴完整车牌（自动识别蓝/绿牌）。
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
    </div>
  )
}
