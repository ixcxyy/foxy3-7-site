import type { Metadata, Viewport } from 'next'
import { Inter, Space_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-space-mono" });

export const metadata: Metadata = {
  title: 'Foxy 3-7 | Official Website',
  description: 'Foxy 3-7 - Rock aus Oesterreich. Hoer unsere Musik, entdecke die Lyrics und sieh dir die Gallery an.',
  keywords: ['Foxy 3-7', 'rock band', 'music', 'Austrian band', 'rock aus Oesterreich'],
}

export const viewport: Viewport = {
  themeColor: '#111111',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de">
      <head>
        <link rel="dns-prefetch" href="//open.spotify.com" />
        <link rel="dns-prefetch" href="//www.instagram.com" />
        <link rel="dns-prefetch" href="//www.youtube.com" />
        <link rel="dns-prefetch" href="//calendar.google.com" />
        <link rel="preconnect" href="https://open.spotify.com" crossOrigin="" />
        <link rel="preconnect" href="https://www.instagram.com" crossOrigin="" />
        <link rel="preconnect" href="https://www.youtube.com" crossOrigin="" />
        <link rel="preconnect" href="https://calendar.google.com" crossOrigin="" />
      </head>
      <body className={`${_inter.variable} ${_spaceMono.variable} font-sans antialiased`} style={{ backgroundColor: "#0a0a0a", color: "#f0f0f0" }}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
