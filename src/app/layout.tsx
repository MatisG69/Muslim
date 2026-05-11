import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter, Amiri } from 'next/font/google'
import './globals.css'
import { AppProviders } from './providers'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Sajda — Compagnon de prière',
  description: "Horaires de prière et alarme Fajr qui ne s'arrête qu'avec une photo de votre tapis.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sajda',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f3a2e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='fr' className={`${cormorant.variable} ${inter.variable} ${amiri.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem('sajda.splash.shown')==='1'){document.documentElement.classList.add('splash-skip')}}catch(_){}`,
          }}
        />
      </head>
      <body>
        <div className='relative min-h-dvh'>
          <div
            className='pointer-events-none fixed inset-0 opacity-[0.04]'
            style={{ backgroundImage: 'url(/patterns/arabesque.svg)', backgroundSize: '180px' }}
            aria-hidden
          />
          <AppProviders>{children}</AppProviders>
        </div>
      </body>
    </html>
  )
}
