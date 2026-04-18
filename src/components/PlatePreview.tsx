import { clsx } from 'clsx'
import { useEffect, useState } from 'react'
import type { PlateChars, PlateKind } from '../lib/plate'
import { displayText } from '../lib/plate'

function bgClass(kind: PlateKind) {
  if (kind === 'blue') return 'bg-gradient-to-b from-[#2b6cff] to-[#1f50d8]'
  // 绿牌：白→绿 渐变（更接近真实）
  if (kind === 'green_small')
    return 'bg-gradient-to-r from-[#f7fff9] via-[#d9ffe7] to-[#49e28a]'
  return 'bg-gradient-to-r from-[#fbfffc] via-[#d6ffe5] to-[#3fe07f]'
}

function capText(chars: PlateChars) {
  const a = (chars[0] || '').toUpperCase()
  const b = (chars[1] || '').toUpperCase()
  return `${a}${b}`.slice(0, 2) || '验牌'
}

function ScrewHole(props: { className: string; sealed?: boolean; text: string }) {
  return (
    <div className={clsx('absolute', props.className)}>
      {/* 预留孔 */}
      <div className="plate-hole" />
      {/* 车牌钉+帽（确认后显示） */}
      {props.sealed ? (
        <div className="plate-cap">
          <div className="plate-cap__bolt" />
          <div className="plate-cap__text">{props.text}</div>
        </div>
      ) : null}
    </div>
  )
}

export default function PlatePreview(props: {
  kind: PlateKind
  chars: PlateChars
  sealed?: boolean
  animateKey?: number
  className?: string
}) {
  const [anim, setAnim] = useState(false)
  const hasInput = props.chars.some((c) => !!c)

  useEffect(() => {
    if (!props.animateKey) return
    setAnim(true)
    const t = window.setTimeout(() => setAnim(false), 780)
    return () => window.clearTimeout(t)
  }, [props.animateKey])

  return (
    <div
      className={clsx(
        // 小型车牌：440x140，宽高比约 3.14
        'relative mx-auto w-full max-w-[360px] aspect-[440/140] overflow-hidden rounded-[14px] shadow-[0_22px_45px_-30px_rgba(0,0,0,0.55)]',
        bgClass(props.kind),
        anim && 'plate-anim',
        props.className,
      )}
    >
      <div
        className={clsx(
          'absolute inset-[6px] rounded-[11px]',
          props.kind === 'blue' ? 'border border-white/55' : 'border border-black/20',
        )}
      />
      {anim ? <div className="plate-shine" /> : null}

      <div className="relative flex h-full items-center justify-center px-6">
        <div className="flex-1 text-center">
          <div
            className={clsx(
              // 禁止换行；绿牌/蓝牌统一使用自适应字号，避免 8 位时挤到换行
              'whitespace-nowrap leading-none font-semibold drop-shadow-sm text-[clamp(20px,6.2vw,28px)] tracking-[0.18em]',
              props.kind === 'blue' ? 'text-white' : 'text-[#0b0b10]',
            )}
          >
            {displayText(props.kind, props.chars)}
          </div>
          {!hasInput ? (
            <div
              className={clsx(
                'mt-1 text-[11px]',
                props.kind === 'blue' ? 'text-white/80' : 'text-black/55',
              )}
            >
              预览仅供模拟 · 牌没有问题！
            </div>
          ) : null}
        </div>
      </div>

      {/* 四角螺丝孔位（固定位置） */}
      <ScrewHole
        className="left-[7%] top-[18%]"
        sealed={props.sealed}
        text={capText(props.chars)}
      />
      <ScrewHole
        className="right-[7%] top-[18%]"
        sealed={props.sealed}
        text={capText(props.chars)}
      />
      <ScrewHole
        className="left-[7%] bottom-[18%]"
        sealed={props.sealed}
        text={capText(props.chars)}
      />
      <ScrewHole
        className="right-[7%] bottom-[18%]"
        sealed={props.sealed}
        text={capText(props.chars)}
      />
    </div>
  )
}
