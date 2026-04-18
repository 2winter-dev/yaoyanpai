import { clsx } from 'clsx'
import { useEffect, useState } from 'react'
import type { PlateChars } from '../../lib/plate'

function capText(chars: PlateChars) {
  const a = (chars[0] || '').toUpperCase()
  const b = (chars[1] || '').toUpperCase()
  return `${a}${b}`.slice(0, 2) || '验牌'
}

function ScrewHoleTop(props: { className: string; sealed?: boolean; text: string }) {
  return (
    <div className={clsx('absolute z-[60]', props.className)}>
      <div className="plate-hole" />
      {props.sealed ? (
        <div className="plate-cap">
          <div className="plate-cap__bolt" />
          <div className="plate-cap__text">{props.text}</div>
        </div>
      ) : null}
    </div>
  )
}

export default function PlateMotoCN(props: {
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

  const top = `${props.chars[0] || ''}·${props.chars[1] || ''}`.toUpperCase()
  const bottom = props.chars.slice(2).join('').toUpperCase()

  return (
    <div
      className={clsx(
        // 普通摩托车号牌常见外廓：220×140（更接近正方形）
        // 视觉上相对小车牌更小一些
        '[container-type:inline-size] relative mx-auto w-full max-w-[280px] aspect-[220/140] overflow-hidden rounded-[14px] bg-[#f5c233] shadow-[0_22px_45px_-30px_rgba(0,0,0,0.55)]',
        anim && 'plate-anim',
        props.className,
      )}
    >
      <div className="absolute inset-[6px] rounded-[11px] border border-black/30" />
      {anim ? <div className="plate-shine" /> : null}

      {/* 上方两个孔位 */}
      <ScrewHoleTop className="left-[18%] top-[12%]" sealed={props.sealed} text={capText(props.chars)} />
      <ScrewHoleTop className="right-[18%] top-[12%]" sealed={props.sealed} text={capText(props.chars)} />

      <div className="relative flex h-full flex-col items-center justify-center px-5 pt-2">
        <div className="w-full text-center">
          <div className="mt-1 font-semibold text-[#0b0b10] plate-emboss-dark text-[clamp(28px,18cqw,58px)] tracking-[0.12em]">
            <span className="inline-block max-w-full scale-x-[0.92]">{top}</span>
          </div>
          <div className="mt-0.5 font-semibold text-[#0b0b10] plate-emboss-dark text-[clamp(40px,26cqw,84px)] tracking-[0.16em]">
            <span className="inline-block max-w-full scale-x-[0.92]">{bottom}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
