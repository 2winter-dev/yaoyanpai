import { useEffect, type ReactNode } from 'react'

export default function Sheet(props: {
  open: boolean
  title?: string
  children: ReactNode
  onClose: () => void
}) {
  useEffect(() => {
    if (!props.open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [props.open, props.onClose])

  if (!props.open) return null

  return (
    <div className="fixed inset-0 z-[2000]">
      <button
        aria-label="关闭"
        className="absolute inset-0 bg-black/20"
        onClick={props.onClose}
      />
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto w-full max-w-[420px] px-4 pb-[max(env(safe-area-inset-bottom),12px)]">
          <div className="glass-card overflow-hidden rounded-[28px]">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="text-[15px] font-semibold tracking-tight text-[color:var(--app-text)]">
                {props.title ?? '请选择'}
              </div>
              <button
                className="icon-btn h-9 w-9"
                onClick={props.onClose}
                aria-label="关闭"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto px-5 pb-8">{props.children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
