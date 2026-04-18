import { clsx } from 'clsx'
import { useEffect, useState } from 'react'
import type { PlateChars } from '../../lib/plate'
import { displayText } from '../../lib/plate'

export default function PlateMO(props: {
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
        '[container-type:inline-size] relative mx-auto w-full max-w-[360px] aspect-[440/140] overflow-hidden rounded-[14px] bg-gradient-to-b from-[#111318] to-[#000000] shadow-[0_22px_45px_-30px_rgba(0,0,0,0.65)]',
        anim && 'plate-anim',
        props.className,
      )}
    >
      <div className="absolute inset-[6px] rounded-[11px] border border-white/35" />
      {anim ? <div className="plate-shine" /> : null}

      <div className="relative flex h-full items-center justify-center px-6">
        <div className="flex-1 text-center">
          <div className="whitespace-nowrap leading-none font-semibold text-white plate-emboss-light text-[clamp(24px,16cqw,54px)] tracking-[0.06em]">
            <span className="inline-block max-w-full origin-center scale-x-[0.88]">{displayText('mo', props.chars)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
