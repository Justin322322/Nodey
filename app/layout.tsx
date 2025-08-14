import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import Silk from '@/components/ui/Silk/Silk'
import { Github } from 'lucide-react'
import { landingButtonVariants } from '@/components/ui/button'
import { ToasterProvider } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  weight: 'variable',
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Nodey - Workflow Automation Builder',
  description: 'A simple low-code node builder for workflow automation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} ${inter.variable} bg-background text-foreground` }>
        {/* Persistent global background to avoid white flashes between routes */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <Silk speed={5} scale={1} color="#7B7481" noiseIntensity={1.5} rotation={0} />
        </div>
        <ToasterProvider>
          {children}
        </ToasterProvider>
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
      </body>
    </html>
  )
}
