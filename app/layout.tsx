import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import Silk from '@/components/ui/Silk/Silk'
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
      </body>
    </html>
  )
}
