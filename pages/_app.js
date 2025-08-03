import '../styles/globals.css'
import Head from 'next/head'
import { AuthProvider } from '../contexts/AuthContext'

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>ProcessAudit AI - Automate Your Business Processes</title>
        <meta name="description" content="AI-powered process analysis to identify automation opportunities and boost your business efficiency" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  )
}