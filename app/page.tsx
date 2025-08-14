import { landingButtonVariants } from '@/components/ui/button'
import { ArrowRight, Cpu, Play, FolderOpen, Github } from 'lucide-react'
import { Suspense, lazy } from 'react'
import WelcomeLink from '@/components/landing/welcome-link'

// Lazy load heavy components
const LandingFlowPreview = lazy(() => import('@/components/landing/landing-flow-preview'))
const HeroProximityTitle = lazy(() => import('@/components/landing/hero-title'))
const FeatureWorkflowSection = lazy(() => import('@/components/landing/feature-workflow'))

// Modern badge component
function FeatureBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:border-white/30">
      <Cpu className="w-4 h-4" />
      {children}
    </div>
  )
}

// Modern hero section
function HeroSection() {
  return (
    <section className="relative py-20 sm:py-28 lg:py-32 overflow-hidden">

      
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          {/* Feature badge */}
          <div className="flex justify-center">
            <FeatureBadge>Local‑first workflow automation</FeatureBadge>
          </div>

          {/* Main heading */}
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-white leading-[0.9]">
              <Suspense fallback={
                <div className="h-24 sm:h-28 lg:h-32 text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-white">
                  Build automations at the speed of thought
                </div>
              }>
                  <HeroProximityTitle />
              </Suspense>
            </h1>
          </div>

          {/* Description */}
          <p className="max-w-4xl mx-auto text-lg sm:text-xl lg:text-2xl text-white/80 leading-relaxed font-light">
            Nodey is a focused, friction‑free workflow editor. Drag, connect, ship. 
            Your data lives in your browser, your logic is portable, and your ideas go from sketch to ship in minutes.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <WelcomeLink
              href="/editor"
              className={landingButtonVariants({ intent: 'primary', size: 'lg' })}
            >
              <Play className="w-5 h-5 mr-2" />
              Open the Editor
              <ArrowRight className="ml-2 h-5 w-5" />
            </WelcomeLink>
            <WelcomeLink
              href="/workflows"
              className={landingButtonVariants({ intent: 'secondary', size: 'lg' })}
            >
              <FolderOpen className="w-5 h-5 mr-2" />
              View Workflows
            </WelcomeLink>
          </div>
        </div>

        {/* Live ReactFlow preview */}
        <div className="mt-16 sm:mt-20 lg:mt-24 w-full max-w-6xl lg:max-w-7xl mx-auto">
          <div className="relative rounded-2xl border border-white/20 bg-white/5 p-2 shadow-2xl shadow-black/40 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10 rounded-2xl" />
            <Suspense fallback={
              <div className="h-80 sm:h-96 lg:h-[28rem] bg-white/5 rounded-xl animate-pulse flex items-center justify-center">
                <div className="text-white/50 text-lg">Loading workflow preview...</div>
              </div>
            }>
              <LandingFlowPreview />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* Contribute button - landing page only */}
      <a
        href="https://github.com/Justin322322/Nodey"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contribute on GitHub"
        className="fixed top-4 right-4 z-50"
      >
        <span className={`${landingButtonVariants({ intent: 'secondary', size: 'md' })} inline-flex items-center gap-2`}>
          <Github className="h-4 w-4" />
          <span>Contribute</span>
        </span>
      </a>
      {/* Hero section */}
      <HeroSection />

      {/* Feature workflow section */}
      <Suspense fallback={
        <div className="py-20 flex items-center justify-center">
          <div className="text-white/50 text-lg">Loading features...</div>
        </div>
      }>
        <FeatureWorkflowSection />
      </Suspense>
    </main>
  )
}
