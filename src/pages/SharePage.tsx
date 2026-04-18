import { toPng } from 'html-to-image'
import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PlatePreview from '../components/PlatePreview'
import TopBar from '../components/TopBar'
import { displayText, kindLabel } from '../lib/plate'
import { loadHistory } from '../lib/storage'
import shareBanner from '../assets/share_banner.png'

export default function SharePage() {
  const nav = useNavigate()
  const { id } = useParams()
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [onlyPlate, setOnlyPlate] = useState(false)

  const item = useMemo(() => loadHistory().find((x) => x.id === id), [id])

  async function makePng() {
    if (!cardRef.current) throw new Error('卡片未就绪')
    // 背景会被透明导出，这里用当前主题的纯色底
    const theme = document.documentElement.dataset.theme
    const bg = theme === 'dark' ? '#0b0b10' : '#ffffff'
    return await toPng(cardRef.current, {
      cacheBust: true,
      backgroundColor: bg,
      pixelRatio: 2,
    })
  }

  async function download() {
    try {
      setBusy(true)
      const dataUrl = await makePng()
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `我要验牌-${id ?? 'share'}.png`
      a.click()
    } finally {
      setBusy(false)
    }
  }

  async function systemShare() {
    try {
      setBusy(true)
      const dataUrl = await makePng()
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], '牌没有问题.png', { type: blob.type })

      const text = `${item ? displayText(item.kind, item.chars) : ''}｜牌没有问题！`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const navAny = navigator as any
      if (navAny?.canShare?.({ files: [file] })) {
        await navAny.share({ files: [file], text, title: '我要验牌' })
      } else if (navigator.share) {
        await navigator.share({ text, title: '我要验牌' })
      } else {
        await download()
      }
    } finally {
      setBusy(false)
    }
  }

  if (!item) {
    return (
      <div className="min-h-[100svh]">
        <TopBar
          title="分享车牌"
          left={
            <button className="icon-btn" onClick={() => nav(-1)} aria-label="返回">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          }
        />
        <div className="mx-auto w-full max-w-[420px] px-4 pt-10">
          <div className="glass-card px-6 py-10 text-center">
            <div className="text-[16px] font-semibold">找不到这条历史记录</div>
            <div className="mt-2 text-[13px] text-[color:var(--app-subtext)]">可能已被清空或删除</div>
            <button
              className="mt-6 rounded-full bg-black px-5 py-3 text-[13px] font-semibold text-white"
              onClick={() => nav('/history')}
            >
              回到历史
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100svh] pb-10">
      <TopBar
        title={<div className="text-[17px] font-semibold tracking-tight">分享车牌</div>}
        left={
          <button className="icon-btn" onClick={() => nav(-1)} aria-label="返回">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        }
      />

      <div className="mx-auto w-full max-w-[420px] px-4 pt-6">
        {/* 分享卡片（可导出） */}
        <div className="relative">
          <div
            ref={cardRef}
            className={onlyPlate ? 'mx-auto w-fit' : 'share-card'}
          >
            {onlyPlate ? (
              <PlatePreview
                kind={item.kind}
                chars={item.chars}
                sealed={item.sealed ?? true}
                className="w-full"
              />
            ) : (
              <>
                <img
                  src={shareBanner}
                  alt=""
                  className="-mx-3 mb-5 h-[110px] w-[calc(100%+24px)] rounded-[22px] object-contain"
                />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-semibold">我要验牌</div>
                    <div className="mt-1 text-[12px] text-black/45">{kindLabel(item.kind)}</div>
                  </div>
                  <div className="rounded-full bg-black px-3 py-2 text-[12px] font-semibold text-white">
                    牌没有问题！
                  </div>
                </div>

                <div className="mt-5">
                  <PlatePreview kind={item.kind} chars={item.chars} sealed={item.sealed ?? true} />
                </div>

                <div className="mt-5 text-center">
                  <div className="text-[18px] font-semibold tracking-tight">{displayText(item.kind, item.chars)}</div>
                  <div className="mt-1 text-[13px] text-black/45">牌没有问题！</div>
                </div>

                <div className="mt-6 text-center text-[11px] text-black/35">© 我要验牌 · 离线也能用</div>
              </>
            )}
          </div>

          {busy ? (
            <div className="share-loading-mask">
              <div className="flex items-center gap-3 rounded-full bg-black/85 px-4 py-2 text-[12px] font-semibold text-white">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                正在生成分享图片…
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-[12px] text-[color:var(--app-subtext)]">导出内容</div>
          <button
            className="rounded-full bg-black/10 px-4 py-2 text-[12px] font-semibold text-[color:var(--app-text)]"
            onClick={() => setOnlyPlate((v) => !v)}
          >
            {onlyPlate ? '仅车牌：开' : '仅车牌：关'}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            className="btn-secondary disabled:opacity-40"
            disabled={busy}
            onClick={download}
          >
            {busy ? '处理中…' : '保存图片'}
          </button>
          <button
            className="btn-primary disabled:opacity-40"
            disabled={busy}
            onClick={systemShare}
          >
            {busy ? '处理中…' : '系统分享'}
          </button>
        </div>

        {/* 开源地址（不参与导出图片：不在 cardRef 内） */}
        <div className="mt-4 text-center text-[11px] text-[color:var(--app-subtext)]">
          开放源代码：
          <a
            href="https://github.com/2winter-dev/yaoyanpai"
            target="_blank"
            rel="noreferrer"
            className="ml-1 font-semibold text-[color:var(--app-text)] underline decoration-black/20 underline-offset-2"
          >
            https://github.com/2winter-dev/yaoyanpai
          </a>
        </div>

        <div className="mt-4 text-center text-[12px] text-black/45">
          分享文案：{displayText(item.kind, item.chars)}｜牌没有问题！
        </div>
      </div>
    </div>
  )
}
