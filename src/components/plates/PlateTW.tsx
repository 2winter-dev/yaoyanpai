import { clsx } from 'clsx'
import { useEffect, useState } from 'react'
import type { PlateChars } from '../../lib/plate'
import { displayText } from '../../lib/plate'

export default function PlateTW(props: {
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

  return (
    <div
      className={clsx(
        '[container-type:inline-size] relative mx-auto w-full max-w-[360px] aspect-[440/140] overflow-hidden rounded-[14px] bg-gradient-to-b from-[#ffffff] to-[#f3f4f6] shadow-[0_22px_45px_-30px_rgba(0,0,0,0.55)]',
        anim && 'plate-anim',
        props.className,
      )}
    >
      <div className="absolute inset-[6px] rounded-[11px] border border-black/25" />
      {anim ? <div className="plate-shine" /> : null}

      <div className="relative flex h-full items-center justify-center px-6">
        <div className="flex-1 text-center">
          <div className="whitespace-nowrap leading-none font-semibold text-[#0b0b10] plate-emboss-dark text-[clamp(26px,17cqw,58px)] tracking-[0.04em]">
            <span className="inline-block max-w-full origin-center scale-x-[0.88]">{displayText('tw', props.chars)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
