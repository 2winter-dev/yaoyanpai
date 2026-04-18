import type { ReactNode } from 'react'

export default function TopBar(props: {
  title: ReactNode
  left?: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-[420px] px-4 pt-4">
      <div className="grid grid-cols-[44px_1fr_44px] items-center">
        <div className="flex justify-start">{props.left ?? <div />}</div>
        <div className="text-center">{props.title}</div>
        <div className="flex justify-end">{props.right ?? <div />}</div>
      </div>
    </div>
  )
}
