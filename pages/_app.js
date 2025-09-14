import '../styles/globals.css'
import Head from 'next/head'
import { UnifiedAuthProvider } from '../contexts/UnifiedAuthContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import ClerkProviderWrapper from '../components/ClerkProviderWrapper'
import ThemeManager from '../components/theme/ThemeManager'
import { useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function App({ Component, pageProps }) {
  // Fix for Next.js FOUC prevention blocking UI display
  useEffect(() => {
    const body = document.body;
    if (body) {
      body.style.display = 'block';
    }
  }, []);

  // Register service worker for PWA functionality
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered successfully:', registration);
        })
        .catch((error) => {
          console.log('❌ Service Worker registration failed:', error);
        });
    }
  }, []);

  return (
    <ClerkProviderWrapper>
      <UnifiedAuthProvider>
          <ThemeProvider>
            <Head>
              <title>ProcessAudit AI - Automate Your Business Processes</title>
              <meta name="description" content="AI-powered process analysis to identify automation opportunities and boost your business efficiency" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <link rel="icon" href="/favicon.ico" />

              {/* PWA Manifest */}
              <link rel="manifest" href="/manifest.json" />

              {/* PWA Theme Colors */}
              <meta name="theme-color" content="#2563eb" />
              <meta name="background-color" content="#2563eb" />

              {/* iOS PWA Support */}
              <meta name="apple-mobile-web-app-capable" content="yes" />
              <meta name="apple-mobile-web-app-status-bar-style" content="default" />
              <meta name="apple-mobile-web-app-title" content="ProcessAudit AI" />
              <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

              {/* Windows PWA Support */}
              <meta name="msapplication-TileColor" content="#2563eb" />
              <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />

              <style jsx global>{`
                body {
                  display: block !important;
                }
              `}</style>
            </Head>
            <Component {...pageProps} />
            <ThemeManager />
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
        </UnifiedAuthProvider>
    </ClerkProviderWrapper>
  )
}