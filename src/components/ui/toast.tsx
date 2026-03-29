"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

const ToastViewport = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 outline-none",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = "ToastViewport"

type ToastItemProps = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive"
  onClose: () => void
}

function ToastItem({ title, description, variant, onClose }: ToastItemProps) {
  return (
    <div
      className={cn(
        "w-full rounded-lg border bg-background px-4 py-3 text-sm shadow-md",
        variant === "destructive" &&
          "border-destructive/30 bg-destructive/10 text-destructive"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          {title ? <div className="font-medium">{title}</div> : null}
          {description ? (
            <div className="text-muted-foreground">{description}</div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground"
          aria-label="Tutup"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export function Toast() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastViewport>
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          onClose={() => dismiss(toast.id)}
        />
      ))}
    </ToastViewport>
  )
}
