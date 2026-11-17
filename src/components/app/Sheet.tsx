'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

/** Modal que vira "bottom sheet" no celular e janela centralizada no desktop. */
export function Sheet({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-[#2c2325]/45" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full sm:max-w-lg max-h-[92dvh] flex flex-col bg-card rounded-t-3xl sm:rounded-3xl border border-border">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
          <h2 className="text-lg font-normal text-foreground">{title}</h2>
          <button onClick={onClose} className="h-11 w-11 -mr-2 rounded-full flex items-center justify-center hover:bg-muted" aria-label="Fechar"><X className="h-5 w-5" strokeWidth={1.75} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-border pb-[max(env(safe-area-inset-bottom),0.75rem)]">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={'block ' + (className ?? '')}>
      <span className="block mb-1.5 text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  )
}
