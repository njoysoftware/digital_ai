import { type Metadata } from 'next'
import Link from 'next/link'
import { ThemeProvider } from "@/components/theme-provider"
import { dark } from '@clerk/themes'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import React from 'react'
  
import { ModeToggle } from '@/components/ui/toggle-mode'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Bawaslu Lamongan - Asisten AI',
  description: 'BAI (Bawaslu Asisten AI) untuk pengawasan Pemilu di Kabupaten Lamongan.',
  icons: {
    icon: '/icon.png', // Sesuaikan dengan path file Anda
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
     appearance={{
     theme: dark,
   }}>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          crossOrigin="anonymous" />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div id="root-container" className="h-[100dvh]">
          {children}
        </div>
          </ThemeProvider>
        </body>

      </html>
    </ClerkProvider>
  )
}