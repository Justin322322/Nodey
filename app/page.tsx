import Link from 'next/link'
import { Button, landingButtonVariants } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { Suspense, lazy } from 'react'
import WelcomeLink from '@/components/landing/welcome-link'





// Lazy load heavy components
const LandingFlowPreview = lazy(() => import('@/components/landing/landing-flow-preview'))
const HeroProximityTitle = lazy(() => import('@/components/landing/hero-title'))
const FeatureWorkflowSection = lazy(() => import('@/components/landing/feature-workflow'))

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="relative z-10">
        {/* Hero section */}
        <section className="relative">
          <div className="container mx-auto px-6 py-28">
            <div className="relative mx-auto max-w-4xl text-center z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur">
                <span>Local‑first workflow automation</span>
              </div>
              <div className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl font-sans">
                <Suspense fallback={<div className="h-20">Build automations at the speed of thought</div>}>
                  <HeroProximityTitle />
                </Suspense>
              </div>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/80">
                Nodey is a focused, friction‑free workflow editor. Drag, connect, ship. Your data lives in your browser, your logic is portable, and your ideas go from sketch to ship in minutes.
              </p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <WelcomeLink
                  href="/editor"
                  className={landingButtonVariants({ intent: 'primary', size: 'lg' })}
                >
                  Open the Editor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </WelcomeLink>
                <WelcomeLink
                  href="/workflows"
                  className={landingButtonVariants({ intent: 'secondary', size: 'lg' })}
                >
                  View Workflows
                </WelcomeLink>
              </div>
            </div>
            {/* Live ReactFlow preview */}
            <div className="mx-auto mt-16 max-w-5xl rounded-xl border border-white/10 bg-white/5 p-2 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur">
              <Suspense fallback={<div className="h-72 bg-white/5 rounded-lg animate-pulse" />}>
                <LandingFlowPreview />
              </Suspense>
            </div>
          </div>
        </section>

        {/* Feature workflow section (Interactive workflow demonstration) */}
        <Suspense fallback={<div className="h-20" />}>
          <FeatureWorkflowSection />
        </Suspense>



      </div>
    </main>
  )
}
