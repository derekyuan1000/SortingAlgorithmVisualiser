import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sort Visualizer',
  description: 'A sorting algorithm visualizer built with React and Next.js with many different sorting algorithms.',
  generator: 'Derek Yuan',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
