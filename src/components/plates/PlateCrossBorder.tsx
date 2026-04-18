import { clsx } from 'clsx'
import { useEffect, useState } from 'react'
import type { PlateChars, PlateKind } from '../../lib/plate'
import { displayText } from '../../lib/plate'

type Kind = 'yuez_hk' | 'yuez_mo' | 'fv' | 'fu' | 'ft'

function bg(kind: Kind) {
  // 粤Z：黑底白字；FV/FU/FT：白底黑字
  if (kind === 'yuez_hk' || kind === 'yuez_mo') return 'bg-gradient-to-b from-[#0f1218] to-[#000000]'
  // FV/FU/FT：默认展示为后牌（黄底黑字）
  // 黄底后牌（不做渐变）
  return 'bg-[#f5c233]'
}

export default function PlateCrossBorder(props: {
  kind: Kind
  chars: PlateChars
  sealed?: boolean
  animateKey?: number
  className?: string
}) {
  const [anim, setAnim] = useState(false)

  useEffect(() => {
    if (!props.animateKey) return
    setAnim(true)
    const t = window.setTimeout(() => setAnim(false), 780)
    return () => window.clearTimeout(t)
  }, [props.animateKey])

  const lightText = props.kind === 'yuez_hk' || props.kind === 'yuez_mo'
  const isYellowRear = props.kind === 'fv' || props.kind === 'fu' || props.kind === 'ft'

  return (
    <div
      className={clsx(
        // 使用容器查询单位(cqw)让字号随车牌组件宽度变化，避免在不同卡片宽度下溢出
        '[container-type:inline-size] relative mx-auto w-full max-w-[360px] aspect-[440/140] overflow-hidden rounded-[14px] shadow-[0_22px_45px_-30px_rgba(0,0,0,0.55)]',
        bg(props.kind),
        anim && 'plate-anim',
        props.className,
      )}
    >
      <div
        className={clsx(
          'absolute inset-[6px] rounded-[11px]',
          lightText ? 'border border-white/40' : 'border border-black/25',
        )}
      />
      {anim ? <div className="plate-shine" /> : null}

      <div className="relative flex h-full items-center justify-center px-6">
        <div className="flex-1 text-center">
          <div
            className={clsx(
              // 粤Z·xxxx港/澳 字符较多，字号略小，避免越界
              'whitespace-nowrap leading-none font-semibold text-[clamp(26px,16cqw,56px)] tracking-[0.04em]',
              lightText ? 'text-white plate-emboss-light' : 'text-[#0b0b10] plate-emboss-dark',
            )}
          >
            <span className="inline-block max-w-full origin-center scale-x-[0.88]">
              {displayText(props.kind as PlateKind, props.chars)}
            </span>
          </div>
        </div>
      </div>

      {/* 备注：FV/FU/FT 默认显示为后牌（黄底黑字） */}
      {isYellowRear ? (
        <div className="absolute bottom-[10%] right-[7%] rounded-full bg-black/15 px-2 py-1 text-[10px] font-semibold text-black/70">
          后牌
        </div>
      ) : null}
    </div>
  )
}
