import { clsx } from 'clsx'
import { useEffect, useState } from 'react'
import type { PlateChars } from '../../lib/plate'
import { displayText } from '../../lib/plate'

type CNKind = 'blue' | 'green_small' | 'green_large'

function bgClass(kind: CNKind) {
  if (kind === 'blue') return 'bg-gradient-to-b from-[#2b6cff] to-[#1f50d8]'
  // 绿牌：上白下绿（白约10%，绿约80%）
  return ''
}

function capText(chars: PlateChars) {
  const a = (chars[0] || '').toUpperCase()
  const b = (chars[1] || '').toUpperCase()
  return `${a}${b}`.slice(0, 2) || '验牌'
}

function ScrewHole(props: { className: string; sealed?: boolean; text: string }) {
  return (
    // 让孔位/固封装置层级高于文字
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

export default function PlateCN(props: {
  kind: CNKind
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

  const lightText = props.kind === 'blue'
  const bgStyle =
    props.kind === 'blue'
      ? undefined
      : {
          background:
            'linear-gradient(180deg, #ffffff 0%, #ffffff 10%, #caffdf 22%, #2fe678 100%)',
        }

  return (
    <div
      className={clsx(
        // 使用容器查询单位(cqw)让字号随车牌组件宽度变化，避免在不同卡片宽度下溢出
        '[container-type:inline-size] relative mx-auto w-full max-w-[360px] aspect-[440/140] overflow-hidden rounded-[14px] shadow-[0_22px_45px_-30px_rgba(0,0,0,0.55)]',
        bgClass(props.kind),
        anim && 'plate-anim',
        props.className,
      )}
      style={bgStyle}
    >
      <div
        className={clsx(
          'absolute inset-[6px] rounded-[11px]',
          lightText ? 'border border-white/45' : 'border border-black/25',
        )}
      />
      {anim ? <div className="plate-shine" /> : null}

      <div className="relative flex h-full items-center justify-center px-6">
        <div className="flex-1 text-center">
          <div
            className={clsx(
              // 字号/字距更接近真实；加浮雕效果
              // 参考 GA36：小型车号牌外廓 440×140；常见字符高度 90mm（约占高度 64%）
              // 这里按组件高度比例放大，并做横向压缩以接近真实窄体字形
              'whitespace-nowrap leading-none font-semibold tracking-[0.06em]',
              // 绿牌字符略缩小，避免两侧越界
              props.kind === 'blue'
                ? 'text-[clamp(28px,18cqw,64px)]'
                : 'text-[clamp(26px,17cqw,60px)]',
              lightText ? 'text-white plate-emboss-light' : 'text-[#0b0b10] plate-emboss-dark',
            )}
          >
            <span className="inline-block max-w-full origin-center scale-x-[0.86]">
              {displayText(props.kind, props.chars)}
            </span>
          </div>
          {!hasInput ? (
            <div className={clsx('mt-1 text-[11px]', lightText ? 'text-white/80' : 'text-black/55')}>
              预览仅供模拟 · 牌没有问题！
            </div>
          ) : null}
        </div>
      </div>

      {/* 孔位：上下更贴近边缘（远离文字），左右更靠近中间 */}
      <ScrewHole className="left-[12%] top-[12%]" sealed={props.sealed} text={capText(props.chars)} />
      <ScrewHole className="right-[12%] top-[12%]" sealed={props.sealed} text={capText(props.chars)} />
      <ScrewHole className="left-[12%] bottom-[12%]" sealed={props.sealed} text={capText(props.chars)} />
      <ScrewHole className="right-[12%] bottom-[12%]" sealed={props.sealed} text={capText(props.chars)} />
    </div>
  )
}
