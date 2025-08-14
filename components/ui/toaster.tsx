"use client"

import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react"
import { X, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// Hook to detect screen size
function useScreenSize() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640) // sm breakpoint
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])
  
  return isMobile
}

type ToastVariant = "default" | "success" | "destructive"

type ToastOptions = {
  title: string
  description?: string
  duration?: number
  variant?: ToastVariant
  onClick?: () => void
  clickable?: boolean
}

interface InternalToast extends ToastOptions {
  id: string
  createdAt: number
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used within ToasterProvider")
  }
  return ctx
}

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<InternalToast[]>([])
  const isMobile = useScreenSize()

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((options: ToastOptions) => {
    const id = crypto.randomUUID()
    const toast: InternalToast = {
      id,
      createdAt: Date.now(),
      duration: options.duration ?? 3000,
      variant: options.variant ?? "default",
      title: options.title,
      description: options.description,
      clickable: options.clickable,
      onClick: options.onClick,
    }
    setToasts((prev) => [...prev, toast])
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => remove(id), toast.duration)
    }
  }, [remove])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Overlay */}
      <div className="pointer-events-none fixed bottom-20 left-1/2 -translate-x-1/2 z-[999] flex w-full max-w-sm flex-col gap-2 px-4 sm:top-20 sm:bottom-auto sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto w-full rounded-md border p-4 shadow-lg bg-white text-gray-900",
              t.variant === "success" && "border-green-200",
              t.variant === "destructive" && "border-red-200",
              t.variant === "default" && "border-gray-200",
              t.clickable && isMobile && "cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation border-2"
            )}
            onClick={t.clickable && isMobile ? t.onClick : undefined}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{t.title}</div>
                {t.description && (
                  <div className="mt-1 text-sm text-gray-700">{t.description}</div>
                )}
                {t.clickable && isMobile && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-blue-600 font-medium">
                    <span className="sm:hidden">Tap to view logs</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                )}
              </div>
              <button
                aria-label="Close"
                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                onClick={(e) => {
                  e.stopPropagation()
                  remove(t.id)
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}


