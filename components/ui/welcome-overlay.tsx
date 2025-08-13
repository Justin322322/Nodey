"use client"

import React, { useEffect, useMemo, useState } from 'react'

type WelcomeOverlayProps = {
  visible: boolean
  onHidden?: () => void
  durationMs?: number
  fadeOutMs?: number
}

export default function WelcomeOverlay({ visible, onHidden, durationMs = 1800, fadeOutMs = 350 }: WelcomeOverlayProps) {
  const [isExiting, setIsExiting] = useState(false)

  const showOverlay = visible
  const startExitAfterMs = useMemo(() => Math.max(0, durationMs - fadeOutMs), [durationMs, fadeOutMs])

  useEffect(() => {
    if (!showOverlay) return
    setIsExiting(false)
    const exitTimer = setTimeout(() => setIsExiting(true), startExitAfterMs)
    const hideTimer = setTimeout(() => onHidden?.(), durationMs)
    return () => {
      clearTimeout(exitTimer)
      clearTimeout(hideTimer)
    }
  }, [showOverlay, startExitAfterMs, durationMs, onHidden])

  if (!showOverlay) return null

  return (
    <div className={`welcome-overlay welcome-overlay--text-only ${isExiting ? 'welcome-exit' : 'welcome-enter'}`}>
      <div className="welcome-center">
        <div className="welcome-text">Welcome to Nodey</div>
      </div>
    </div>
  )
}


