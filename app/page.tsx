import { landingButtonVariants } from '@/components/ui/button'
import { ArrowRight, Cpu, Play, FolderOpen, Github } from 'lucide-react'
import { Suspense, lazy } from 'react'
import Image from 'next/image'
import WelcomeLink from '@/components/landing/welcome-link'
// Lazy load ALL heavy components including TesseractBackground
const TesseractBackground = lazy(() => import('@/components/effects/TesseractBackground'))
const LandingFlowPreview = lazy(() => import('@/components/landing/landing-flow-preview'))
const HeroProximityTitle = lazy(() => import('@/components/landing/hero-title'))
const FeatureWorkflowSection = lazy(() => import('@/components/landing/feature-workflow'))
const Footer = lazy(() => import('@/components/landing/footer'))

// Modern badge component
function FeatureBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:border-white/30">
      <Cpu className="w-4 h-4" />
      {children}
    </div>
  )
}

// Hero section with transparent background to show Silk background
function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative py-20 sm:py-28 lg:py-32">
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
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
        </div>
      </div>

      {/* Workflow Preview Section with split background effect */}
      <div className="relative">
        {/* Enhanced gradient transition with subtle animation */}
        <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent pointer-events-none" />
        {/* Depth enhancement overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent pointer-events-none" />
        {/* Rice grain separator at the transition */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 overflow-hidden">
          <div className="rice-grain-separator w-full h-[3px]"></div>
        </div>
        
        <div className="relative pb-20 sm:pb-24 lg:pb-32">
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            {/* Live ReactFlow preview */}
            <div className="w-full max-w-6xl lg:max-w-7xl mx-auto relative z-10">
              <div className="relative rounded-2xl border border-white/20 p-2 shadow-2xl shadow-black/40 overflow-hidden">
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
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
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

      {/* Main content */}
      <main className="relative">
        {/* Hero section - transparent background to show Silk */}
        <HeroSection />

        {/* All remaining sections with solid slate background */}
        <div className="bg-slate-900">

          {/* Feature workflow section */}
          <div className="relative">
            <Suspense fallback={
              <div className="py-20 flex items-center justify-center">
                <div className="text-white/50 text-lg">Loading features...</div>
              </div>
            }>
              <FeatureWorkflowSection />
            </Suspense>
          </div>

          {/* CTA section */}
          <section className="relative py-6 sm:py-8 lg:py-10 overflow-hidden">
            {/* Tesseract 3D background effect - Lazy loaded */}
            <Suspense fallback={null}>
              <TesseractBackground />
            </Suspense>
            
            {/* Grid pattern with circular fade mask */}
            <div className="absolute inset-0 bg-grid-pattern" style={{
              mask: 'radial-gradient(ellipse 80% 60% at center, black 40%, transparent 100%)',
              WebkitMask: 'radial-gradient(ellipse 80% 60% at center, black 40%, transparent 100%)',
              zIndex: 2
            }}></div>

            {/* Rice grain shaped separator */}
            <div className="absolute top-0 left-0 right-0 -translate-y-1/2 overflow-hidden" style={{zIndex: 3}}>
              <div className="rice-grain-separator w-full h-[3px]"></div>
            </div>
            {/* Subtle overlay for better text readability */}
            <div className="absolute inset-0 bg-slate-900/30" style={{zIndex: 4}}></div>
            <div className="container mx-auto relative z-10">
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                  {/* Text Content */}
                  <div className="text-center lg:text-left">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
                      Ready to automate your workflows?
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center lg:items-start lg:justify-start justify-center gap-4">
                      <WelcomeLink
                        href="/editor" 
                        className={landingButtonVariants({ intent: 'primary', size: 'lg' })}
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Start Building
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </WelcomeLink>
                      <WelcomeLink
                        href="https://github.com/Justin322322/Nodey"
                        className={landingButtonVariants({ intent: 'secondary', size: 'lg' })}
                      >
                        <Github className="w-5 h-5 mr-2" />
                        View on GitHub
                      </WelcomeLink>
                    </div>
                  </div>
                  
                  {/* ASCII Art Image */}
                  <div className="flex justify-center lg:justify-end">
                    <Image 
                      src="/nodey-ascii.png" 
                      alt="Nodey ASCII Art" 
                      width={700}
                      height={490}
                      className="max-w-full h-auto opacity-90 cursor-pointer ascii-gold-hover"
                      style={{
                        filter: 'brightness(1.1) contrast(1.2)',
                        transition: 'all 0.7s ease-in-out'
                      }}
                      priority={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer with enhanced background effects */}
          <div className="relative landing-enhanced-bg overflow-x-hidden max-w-full">
            {/* Rice grain shaped separator */}
            <div className="absolute top-0 left-0 right-0 -translate-y-1/2 overflow-hidden max-w-full">
              <div className="rice-grain-separator w-full h-[3px] max-w-full"></div>
            </div>
            {/* Footer background enhancement */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-slate-950/80 to-transparent" />
              <div className="absolute bottom-1/4 left-1/3 w-32 h-32 sm:w-48 sm:h-48 bg-slate-700/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/3 right-1/4 w-40 h-40 sm:w-64 sm:h-64 bg-slate-600/5 rounded-full blur-3xl animate-pulse delay-2000" />
              {/* Aurora effects for footer - using constrained animation */}
              <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-blue-500/5 rounded-full blur-3xl" style={{animation: 'breathe-constrained 25s ease-in-out infinite'}} />
              <div className="absolute bottom-1/3 right-1/4 w-44 h-44 sm:w-64 sm:h-64 lg:w-80 lg:h-80 bg-purple-500/5 rounded-full blur-3xl" style={{animation: 'breathe-constrained 30s ease-in-out infinite', animationDelay: '8s'}} />
            </div>
            <Suspense fallback={
              <div className="py-12 flex items-center justify-center border-t border-white/10">
                <div className="text-white/50 text-sm">Loading footer...</div>
              </div>
            }>
              <Footer />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}