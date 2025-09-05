import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Feature flag to enable Clerk authentication
const USE_CLERK_AUTH = process.env.NEXT_PUBLIC_USE_CLERK_AUTH === 'true'

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/org/(.*)',
  '/api/analyze-process',
  '/api/automations/(.*)',
  '/api/saved-reports/(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  // If Clerk is not enabled, allow all routes
  if (!USE_CLERK_AUTH) {
    return
  }

  // Get the current authentication state
  const { userId } = await auth()
  
  console.log('Middleware: Processing request', {
    path: req.nextUrl.pathname,
    userId: !!userId,
    timestamp: new Date().toISOString()
  })

  // Protect routes that require authentication
  // Clerk will automatically redirect to its hosted sign-in page
  if (isProtectedRoute(req)) {
    console.log('Middleware: Protecting route', req.nextUrl.pathname)
    await auth.protect()
  }
})



export const config = {
  matcher: [
    // Include all routes except Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Include API routes
    '/(api|trpc)(.*)',
  ],
}