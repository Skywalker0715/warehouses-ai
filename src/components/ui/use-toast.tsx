"use client"

import * as React from "react"

type ToastProps = {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  duration?: number
  variant?: "default" | "destructive"
}

type ToastAction = ToastProps & {
  id: string
}

type ToastContextValue = {
  toasts: ToastAction[]
  toast: (toast: ToastProps) => void
  dismiss: (toastId?: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined
)

const TOAST_LIMIT = 3

function generateId() {
  return Math.random().toString(36).slice(2)
}

export function ToastProvider({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  const [toasts, setToasts] = React.useState<ToastAction[]>([])

  const dismiss = React.useCallback((toastId?: string) => {
    setToasts((current) =>
      toastId ? current.filter((toast) => toast.id !== toastId) : []
    )
  }, [])

  const toast = React.useCallback(
    (toastProps: ToastProps) => {
      const id = toastProps.id ?? generateId()
      setToasts((current) => {
        const next = [{ ...toastProps, id }, ...current]
        return next.slice(0, TOAST_LIMIT)
      })

      if (toastProps.duration && toastProps.duration > 0) {
        window.setTimeout(() => dismiss(id), toastProps.duration)
      }
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}
