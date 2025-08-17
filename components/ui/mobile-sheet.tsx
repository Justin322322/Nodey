"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// Hook for swipe down to close functionality
function useSwipeToClose(onClose: () => void, enabled: boolean = true) {
  const [startY, setStartY] = React.useState<number | null>(null)
  const [currentY, setCurrentY] = React.useState<number | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    if (!enabled) return
    setStartY(e.touches[0].clientY)
    setCurrentY(e.touches[0].clientY)
    setIsDragging(true)
  }, [enabled])

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (!enabled || !isDragging || startY === null) return
    setCurrentY(e.touches[0].clientY)
  }, [enabled, isDragging, startY])

  const handleTouchEnd = React.useCallback(() => {
    if (!enabled || !isDragging || startY === null || currentY === null) {
      setStartY(null)
      setCurrentY(null)
      setIsDragging(false)
      return
    }

    const deltaY = currentY - startY
    const threshold = 100 // Minimum distance to trigger close

    if (deltaY > threshold) {
      onClose()
    }

    setStartY(null)
    setCurrentY(null)
    setIsDragging(false)
  }, [enabled, isDragging, startY, currentY, onClose])

  const swipeDistance = isDragging && startY !== null && currentY !== null 
    ? Math.max(0, currentY - startY) 
    : 0

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    swipeDistance,
    isDragging
  }
}

interface MobileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
}

const MobileSheet = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  MobileSheetProps
>(({ open, onOpenChange, children, title, description, className, ...props }, ref) => {
  const { 
    handleTouchStart, 
    handleTouchMove, 
    handleTouchEnd, 
    swipeDistance, 
    isDragging 
  } = useSwipeToClose(() => onOpenChange(false))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={ref}
        className={cn(
          "p-0 flex flex-col bg-white text-gray-900 border border-gray-200 shadow-xl", // Apply delete modal styling
          className
        )}
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevent auto-focus on mobile
        style={{
          transform: isDragging ? `translateY(${swipeDistance}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
        {...props}
      >
        {/* Drag Handle - Touch area for swipe gesture */}
        <div 
          className="py-3 flex-shrink-0 sm:hidden cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="mx-auto h-1.5 w-10 rounded-full bg-gray-300" aria-hidden="true" />
        </div>

        {(title || description) && (
          <DialogHeader className="px-6 pt-2 pb-2 flex-shrink-0">
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </DialogHeader>
        )}
        
        {/* Content - This is the scrollable area */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-6">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
})
MobileSheet.displayName = "MobileSheet"

// Action sheet variant for lists of actions
interface MobileActionSheetProps extends Omit<MobileSheetProps, 'children'> {
  actions: Array<{
    label: string
    icon?: React.ReactNode
    onClick: () => void
    disabled?: boolean
    variant?: 'default' | 'destructive'
  }>
  trigger?: React.ReactNode
}

const MobileActionSheet = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  MobileActionSheetProps
>(({ open, onOpenChange, actions, trigger, title = "Actions", description, className, ...props }, ref) => {
  const { 
    handleTouchStart, 
    handleTouchMove, 
    handleTouchEnd, 
    swipeDistance, 
    isDragging 
  } = useSwipeToClose(() => onOpenChange(false))

  return (
    <>
      {/* Render the trigger button if provided */}
      {trigger && (
        <div onClick={() => onOpenChange(true)}>
          {trigger}
        </div>
      )}
      
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          ref={ref}
          className={cn(
            "p-0 flex flex-col max-h-[75vh] bg-white text-gray-900 border border-gray-200 shadow-xl", // Apply delete modal styling
            className
          )}
          onOpenAutoFocus={(e) => e.preventDefault()} // Prevent auto-focus on mobile
          style={{
            transform: isDragging ? `translateY(${swipeDistance}px)` : undefined,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          {...props}
        >
          {/* Drag Handle - Touch area for swipe gesture */}
          <div 
            className="py-3 flex-shrink-0 sm:hidden cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="mx-auto h-1.5 w-10 rounded-full bg-gray-300" aria-hidden="true" />
          </div>

          <DialogHeader className="px-6 pt-2 pb-2 flex-shrink-0">
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </DialogHeader>
          
          {/* Actions - Scrollable if needed */}
          <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4 space-y-1">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick()
                  onOpenChange(false)
                }}
                disabled={action.disabled}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors min-h-[44px] touch-manipulation",
                  "hover:bg-gray-50 active:bg-gray-100 border border-gray-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  action.variant === 'destructive' 
                    ? "text-red-600 hover:bg-red-50 active:bg-red-100 border-red-200" 
                    : "text-gray-700"
                )}
              >
                {action.icon && <span className="text-current">{action.icon}</span>}
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
            
            {/* Close button */}
            <button
              onClick={() => onOpenChange(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-t border-gray-200 min-h-[44px] touch-manipulation"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
})
MobileActionSheet.displayName = "MobileActionSheet"

export { MobileSheet, MobileActionSheet }