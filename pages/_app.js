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

  return (
    <ClerkProviderWrapper>
      <UnifiedAuthProvider>
          <ThemeProvider>
            <Head>
              <title>ProcessAudit AI - Automate Your Business Processes</title>
              <meta name="description" content="AI-powered process analysis to identify automation opportunities and boost your business efficiency" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <link rel="icon" href="/favicon.ico" />
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