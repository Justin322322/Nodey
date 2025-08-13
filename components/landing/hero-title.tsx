"use client";

import React, { useRef } from 'react'
import VariableProximity from '@/components/ui/VariableProximity/VariableProximity'

export default function HeroProximityTitle() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  return (
    <div ref={containerRef} style={{ position: 'relative' }} className="select-none text-white">
      <VariableProximity
        label={'Build automations at the speed of thought'}
        className={'variable-proximity-demo [text-shadow:0_2px_20px_rgba(0,0,0,0.25)]'}
        fromFontVariationSettings="'wght' 400"
        toFontVariationSettings="'wght' 900"
        containerRef={containerRef}
        radius={140}
        falloff="linear"
      />
    </div>
  )
}


