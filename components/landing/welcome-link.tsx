"use client"

import Link from 'next/link'
import React from 'react'

type WelcomeLinkProps = {
  href: string
  className?: string
  children: React.ReactNode
}

 export default function WelcomeLink({ href, className, children }: WelcomeLinkProps) {
  const handleClick = React.useCallback(() => {
    try { sessionStorage.setItem('nodey_welcome', '1') } catch {
      // no-op
    }
  }, [])

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  )
}


