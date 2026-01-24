import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CT Legislator Lookup',
  description: 'Find your Connecticut state legislators by address',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}