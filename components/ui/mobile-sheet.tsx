"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

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
>(({ open, onOpenChange, children, title, description, className, ...props }, ref) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      ref={ref}
      className={cn(
        "p-0 flex flex-col bg-white text-gray-900 border border-gray-200 shadow-xl", // Apply delete modal styling
        className
      )}
      {...props}
    >
      {(title || description) && (
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
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
))
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
>(({ open, onOpenChange, actions, trigger, title = "Actions", description, className, ...props }, ref) => (
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
        {...props}
      >
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
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
))
MobileActionSheet.displayName = "MobileActionSheet"

export { MobileSheet, MobileActionSheet }