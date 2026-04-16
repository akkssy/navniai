import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import Providers from '@/components/Providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: 'NavniAI - Visual AI Agent Orchestration',
  description: 'Build, connect, and run AI agent workflows for any domain — coding, HR, legal, marketing, and more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-surface-100 text-ink-700 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

