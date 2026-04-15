import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Providers from '@/components/Providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
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
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-dark-950 text-white noise-bg`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

