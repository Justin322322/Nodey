"use client"

import { useState, useEffect } from 'react'
import { Shield, ShieldCheck, ShieldAlert, Info } from 'lucide-react'
import { getSecurityStatus } from '@/lib/security'

interface SecurityStatusProps {
  className?: string
  showDetails?: boolean
}

export function SecurityStatus({ className = "", showDetails = false }: SecurityStatusProps) {
  const [securityState, setSecurityState] = useState({
    encrypted: false,
    sessionBased: false,
    deviceKey: false
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const updateStatus = () => {
      setSecurityState(getSecurityStatus())
    }
    
    updateStatus()
    // Update status periodically
    const interval = setInterval(updateStatus, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    return null // Avoid hydration issues
  }

  const isSecure = securityState.encrypted && securityState.deviceKey
  const StatusIcon = isSecure ? ShieldCheck : ShieldAlert

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <StatusIcon 
        className={`w-4 h-4 ${isSecure ? 'text-green-600' : 'text-yellow-600'}`} 
      />
      <span className={`text-sm font-medium ${isSecure ? 'text-green-700' : 'text-yellow-700'}`}>
        {isSecure ? 'Credentials Encrypted' : 'Security Active'}
      </span>
      
      {showDetails && (
        <div className="text-xs text-gray-600">
          {securityState.encrypted && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded">
              <Shield className="w-3 h-3" />
              Encrypted
            </span>
          )}
          {securityState.sessionBased && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded ml-1">
              <Info className="w-3 h-3" />
              Session-based
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function SecurityBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-md ${className}`}>
      <ShieldCheck className="w-3 h-3 text-green-600" />
      <span className="text-xs font-medium text-green-700">Encrypted</span>
    </div>
  )
}

export function SecurityWarning({ 
  message, 
  type = "info",
  className = "" 
}: { 
  message: string
  type?: "info" | "warning" | "error"
  className?: string 
}) {
  const colors = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800", 
    error: "bg-red-50 border-red-200 text-red-800"
  }
  
  const icons = {
    info: Info,
    warning: ShieldAlert,
    error: ShieldAlert
  }
  
  const Icon = icons[type]
  
  return (
    <div className={`flex items-start gap-2 p-3 border rounded-md ${colors[type]} ${className}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span className="text-sm">{message}</span>
    </div>
  )
}
