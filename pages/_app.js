import '../styles/globals.css'
import Head from 'next/head'
import { AuthProvider } from '../contexts/AuthContext'
import { UnifiedAuthProvider } from '../contexts/UnifiedAuthContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import ClerkProviderWrapper from '../components/ClerkProviderWrapper'
import ThemeManager from '../components/theme/ThemeManager'

export default function App({ Component, pageProps }) {
  return (
    <ClerkProviderWrapper>
      <AuthProvider>
        <UnifiedAuthProvider>
          <ThemeProvider>
            <Head>
              <title>ProcessAudit AI - Automate Your Business Processes</title>
              <meta name="description" content="AI-powered process analysis to identify automation opportunities and boost your business efficiency" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <link rel="icon" href="/favicon.ico" />
            </Head>
            <Component {...pageProps} />
            <ThemeManager />
          </ThemeProvider>
        </UnifiedAuthProvider>
      </AuthProvider>
    </ClerkProviderWrapper>
  )
}