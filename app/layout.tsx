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
  metadataBase: new URL(process.env.NODE_ENV === 'production' ? 'https://nodey.vercel.app' : 'http://localhost:3000'),
  title: 'Nodey - Workflow Automation Builder',
  description: 'Build powerful workflow automations with our intuitive visual node editor. Drag, connect, and deploy automated workflows in minutes with local-first architecture.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'Nodey - Workflow Automation Builder',
    description: 'Build powerful workflow automations with our intuitive visual node editor. Drag, connect, and deploy automated workflows in minutes with local-first architecture.',
    url: 'https://nodey.vercel.app',
    siteName: 'Nodey',
    images: [
      {
        url: '/nodey-social-preview.png',
        width: 1200,
        height: 630,
        alt: 'Nodey - Visual workflow automation builder',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nodey - Workflow Automation Builder',
    description: 'Build powerful workflow automations with our intuitive visual node editor. Drag, connect, and deploy automated workflows in minutes.',
    images: ['/nodey-social-preview.png'],
  },
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
