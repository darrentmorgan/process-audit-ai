import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useClerk } from '@clerk/nextjs'
import { 
  Zap, 
  Target, 
  BarChart3, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight,
  Bot,
  Cog,
  DollarSign,
  LogIn,
  UserPlus
} from 'lucide-react'

const HospoDojoBrandedLanding = ({ onSignUp }) => {
  const router = useRouter()
  const { redirectToSignIn, redirectToSignUp } = useClerk()
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Set brand attribute for theming
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-brand', 'hospo-dojo')
    }
    
    return () => {
      if (typeof document !== 'undefined') {
        document.documentElement.removeAttribute('data-brand')
      }
    }
  }, [])

  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    
    try {
      // Call parent callback if provided
      if (onSignUp) {
        await onSignUp(email)
      }
      
      setIsSubmitted(true)
    } catch (error) {
      console.error('Error signing up:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = () => {
    redirectToSignIn({
      redirectUrl: '/dashboard'
    })
  }

  const handleAuthSignUp = () => {
    redirectToSignUp({
      redirectUrl: '/dashboard'
    })
  }

  return (
    <div 
      className="min-h-screen overflow-hidden"
      style={{
        background: `linear-gradient(135deg, #42551C 0%, #1C1C1C 100%)`, // Hospo Dojo colors
        fontFamily: '"DM Sans", Inter, system-ui, sans-serif' // Hospo Dojo typography
      }}
    >
      {/* Hero Section - Mobile Optimized */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header - Mobile Responsive */}
        <div className="flex justify-between items-center mb-8 sm:mb-12 lg:mb-16">
          <img 
            src="/Hospo-Dojo-Logo.svg" 
            alt="Hospo Dojo - Hospitality Operations Platform"
            className="h-6 sm:h-7 lg:h-8 w-auto object-contain max-w-[120px] sm:max-w-none flex-shrink-0"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          
          {/* Auth Buttons - Mobile Touch Optimized */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={handleSignIn}
              className="hd-touch-feedback flex items-center px-2 sm:px-3 lg:px-4 py-2 text-white hover:text-yellow-200 transition-all duration-200 text-sm sm:text-base rounded-lg"
              style={{ minHeight: '44px' }}
            >
              <LogIn className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="font-medium">Sign In</span>
            </button>
            <button
              onClick={handleAuthSignUp}
              className="hd-button hd-button--secondary flex items-center px-3 sm:px-4 lg:px-6 py-2 text-sm sm:text-base font-semibold"
              style={{ minHeight: '44px' }}
            >
              <UserPlus className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Join the Dojo</span>
              <span className="sm:hidden">Join</span>
            </button>
          </div>
        </div>

        {/* Hero Content - Mobile Responsive Layout */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            {/* Left Column - Text Content - Mobile Optimized */}
            <div className="text-center lg:text-left px-2 sm:px-0">
              <h1 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight"
                style={{ 
                  fontFamily: '"Gefika", "Bebas Neue", "Oswald", Impact, sans-serif'
                }}
              >
                PREP FOR SUCCESS WITH YOUR
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                  HOSPITALITY
                </span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-blue-400">
                  OPERATIONS
                </span>
              </h1>
              
              <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0" style={{ color: '#EAE8DD' }}>
                <strong>Be battle-ready with actionable frameworks and mentors.</strong> AI-powered process analysis 
                that identifies hidden automation opportunities in your hospitality business. 
                Get precise ROI calculations and step-by-step implementation plans in minutes.
              </p>

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 mb-6 sm:mb-8 lg:mb-10 justify-center lg:justify-start">
                <div className="flex items-center text-green-300 justify-center lg:justify-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm sm:text-base">5-Minute Analysis</span>
                </div>
                <div className="flex items-center text-green-300 justify-center lg:justify-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Precise ROI Calculations</span>
                </div>
                <div className="flex items-center text-green-300 justify-center lg:justify-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Implementation Roadmaps</span>
                </div>
              </div>

              {/* Call to Action Options - Mobile Optimized */}
              <div className="max-w-sm sm:max-w-md mx-auto lg:mx-0 px-2 sm:px-0">
                <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                  {/* Primary CTA - Join the Dojo - Mobile Touch Optimized */}
                  <button
                    onClick={handleAuthSignUp}
                    className="hd-button hd-button--primary w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-white font-bold rounded-xl text-base sm:text-lg"
                    style={{ minHeight: '48px' }}
                  >
                    <UserPlus className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                    <span className="hidden sm:inline tracking-wide">Join the Dojo - Start Free Analysis</span>
                    <span className="sm:hidden tracking-wide">Join the Dojo - Start Free</span>
                    <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                  </button>
                  
                  {/* Secondary CTA - Join Waitlist - Mobile Optimized */}
                  {!isSubmitted ? (
                    <div className="text-center">
                      <p className="text-xs sm:text-sm mb-2 sm:mb-3" style={{ color: '#EAE8DD' }}>
                        Or join our waitlist for updates
                      </p>
                      <form onSubmit={handleSignUp} className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="hd-input-mobile flex-1"
                          required
                        />
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="hd-button hd-button--primary px-4 sm:px-6 py-3 text-white font-semibold rounded-lg disabled:opacity-50 min-w-[100px] sm:min-w-[120px]"
                          style={{ minHeight: '44px' }}
                        >
                          {isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <span className="tracking-wide">Join</span>
                          )}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div 
                      className="text-center border rounded-lg p-4"
                      style={{ 
                        backgroundColor: 'rgba(66, 85, 28, 0.3)', 
                        borderColor: '#42551C' 
                      }}
                    >
                      <CheckCircle className="w-6 h-6 mx-auto mb-2" style={{ color: '#EAE8DD' }} />
                      <p style={{ color: '#EAE8DD' }}>You&apos;re on the waitlist!</p>
                    </div>
                  )}
                </div>
                
                <p className="text-xs sm:text-sm text-center leading-relaxed" style={{ color: '#EAE8DD' }}>
                  <strong>Free to start</strong> • Save your results • No credit card required
                </p>
              </div>
            </div>

            {/* Right Column - Visual Demo - Mobile Optimized */}
            <div className="relative mt-6 lg:mt-0">
              <div 
                className="backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border mx-2 sm:mx-0"
                style={{ 
                  backgroundColor: 'rgba(234, 232, 221, 0.1)',
                  borderColor: 'rgba(234, 232, 221, 0.3)'
                }}
              >
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-4 text-center lg:text-left">See What You&apos;ll Get:</h3>
                </div>

                {/* Mock Analysis Results - Hospitality Focused - Mobile Optimized */}
                <div className="space-y-3 sm:space-y-4">
                  <div 
                    className="rounded-lg sm:rounded-xl p-3 sm:p-4 text-white"
                    style={{ background: `linear-gradient(135deg, #42551C 0%, #1C1C1C 100%)` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      <div className="flex items-center">
                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm sm:text-base">Automate Guest Check-in</p>
                          <p className="text-xs sm:text-sm opacity-90">90% Priority Score</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right ml-7 sm:ml-0">
                        <p className="font-bold text-sm sm:text-base">$18K/year</p>
                        <p className="text-xs sm:text-sm opacity-90">savings</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="rounded-lg sm:rounded-xl p-3 sm:p-4"
                    style={{ 
                      backgroundColor: 'rgba(234, 232, 221, 0.2)',
                      color: '#1C1C1C'
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm sm:text-base">Staff Scheduling Optimization</p>
                          <p className="text-xs sm:text-sm opacity-75">82% Priority Score</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right ml-7 sm:ml-0">
                        <p className="font-bold text-sm sm:text-base">12 hours/week</p>
                        <p className="text-xs sm:text-sm opacity-75">saved</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="rounded-lg sm:rounded-xl p-3 sm:p-4"
                    style={{ 
                      backgroundColor: 'rgba(234, 232, 221, 0.2)',
                      color: '#1C1C1C'
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      <div className="flex items-center">
                        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm sm:text-base">Inventory Management</p>
                          <p className="text-xs sm:text-sm opacity-75">78% Priority Score</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right ml-7 sm:ml-0">
                        <p className="font-bold text-sm sm:text-base">8 hours/week</p>
                        <p className="text-xs sm:text-sm opacity-75">saved</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROI Summary - Mobile Optimized */}
                <div 
                  className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2"
                  style={{ 
                    borderColor: '#42551C',
                    backgroundColor: 'rgba(234, 232, 221, 0.1)'
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center text-white text-sm">
                    <div>
                      <div className="font-semibold text-xs sm:text-sm" style={{ color: '#EAE8DD' }}>Total Annual Savings:</div>
                      <div className="font-bold text-lg sm:text-xl">$32,000</div>
                    </div>
                    <div>
                      <div className="font-semibold text-xs sm:text-sm" style={{ color: '#EAE8DD' }}>Implementation Cost:</div>
                      <div className="font-bold text-lg sm:text-xl">$3,200</div>
                    </div>
                    <div>
                      <div className="font-semibold text-xs sm:text-sm" style={{ color: '#EAE8DD' }}>ROI:</div>
                      <div className="font-bold text-lg sm:text-xl text-green-300">900%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements - Responsive */}
              <div className="hidden lg:block absolute -top-4 -right-4 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: '#EAE8DD' }}></div>
              <div className="hidden lg:block absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: '#42551C' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section - Mobile Optimized */}
      <div className="py-8 sm:py-12 lg:py-16" style={{ backgroundColor: '#EAE8DD' }}>
        <div className="container mx-auto px-3 sm:px-4">
          <h2 
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 lg:mb-16"
            style={{ 
              color: '#1C1C1C',
              fontFamily: '"Gefika", "Bebas Neue", "Oswald", Impact, sans-serif'
            }}
          >
            HOW HOSPO DOJO WORKS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <div className="text-center px-2 sm:px-0">
              <div 
                className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
                style={{ backgroundColor: '#42551C' }}
              >
                <Bot className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <h3 
                className="text-lg sm:text-xl font-bold mb-2 sm:mb-3"
                style={{ 
                  color: '#1C1C1C',
                  fontFamily: '"Nimbus Sans", "Helvetica Neue", Arial, sans-serif'
                }}
              >
                1. Describe Your Process
              </h3>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#1C1C1C' }}>
                Simply tell us about any hospitality process - from guest check-in to inventory management. 
                Our AI asks smart follow-up questions to understand the details.
              </p>
            </div>

            <div className="text-center px-2 sm:px-0">
              <div 
                className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
                style={{ backgroundColor: '#42551C' }}
              >
                <Zap className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <h3 
                className="text-lg sm:text-xl font-bold mb-2 sm:mb-3"
                style={{ 
                  color: '#1C1C1C',
                  fontFamily: '"Nimbus Sans", "Helvetica Neue", Arial, sans-serif'
                }}
              >
                2. AI Analysis
              </h3>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#1C1C1C' }}>
                Our advanced AI analyzes your hospitality operations, identifies automation opportunities, 
                and creates frameworks for consistent service excellence.
              </p>
            </div>

            <div className="text-center px-2 sm:px-0">
              <div 
                className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
                style={{ backgroundColor: '#42551C' }}
              >
                <Target className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <h3 
                className="text-lg sm:text-xl font-bold mb-2 sm:mb-3"
                style={{ 
                  color: '#1C1C1C',
                  fontFamily: '"Nimbus Sans", "Helvetica Neue", Arial, sans-serif'
                }}
              >
                3. Get Your Battle Plan
              </h3>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#1C1C1C' }}>
                Receive a prioritized list of automation opportunities with exact tools, costs, 
                timelines, and step-by-step implementation guides for hospitality excellence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section - Mobile Optimized */}
      <div className="py-8 sm:py-12 lg:py-16" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="container mx-auto px-3 sm:px-4">
          <h2 
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 lg:mb-16 leading-tight"
            style={{ 
              color: '#1C1C1C',
              fontFamily: '"Gefika", "Bebas Neue", "Oswald", Impact, sans-serif'
            }}
          >
            TRUSTED BY HOSPITALITY PROFESSIONALS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            <div className="text-center p-4 sm:p-6 rounded-xl border-2 mx-2 sm:mx-0 transition-all duration-300 hover:shadow-lg hover:border-opacity-80" style={{ borderColor: '#42551C' }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center text-white text-base sm:text-lg lg:text-xl font-bold shadow-lg" style={{ backgroundColor: '#42551C' }}>
                JS
              </div>
              <div className="mb-3 sm:mb-4">
                <p className="font-bold text-sm sm:text-base tracking-wide" style={{ color: '#1C1C1C' }}>James Smith</p>
                <p className="text-xs sm:text-sm font-medium" style={{ color: '#42551C' }}>Hotel Manager, Boutique Stays</p>
              </div>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#1C1C1C' }}>
                &quot;Hospo Dojo identified $45K in annual savings we never knew existed. 
                The implementation roadmap was perfect for our hotel operations.&quot;
              </p>
            </div>

            <div className="text-center p-4 sm:p-6 rounded-xl border-2 mx-2 sm:mx-0 transition-all duration-300 hover:shadow-lg hover:border-opacity-80" style={{ borderColor: '#42551C' }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center text-white text-base sm:text-lg lg:text-xl font-bold shadow-lg" style={{ backgroundColor: '#42551C' }}>
                MJ
              </div>
              <div className="mb-3 sm:mb-4">
                <p className="font-bold text-sm sm:text-base tracking-wide" style={{ color: '#1C1C1C' }}>Maria Johnson</p>
                <p className="text-xs sm:text-sm font-medium" style={{ color: '#42551C' }}>Restaurant Owner, Fine Dining Co</p>
              </div>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#1C1C1C' }}>
                &quot;Finally, an AI tool that actually understands hospitality workflows. 
                Saved us 25 hours per week on staff scheduling and inventory!&quot;
              </p>
            </div>

            <div className="text-center p-4 sm:p-6 rounded-xl border-2 mx-2 sm:mx-0 transition-all duration-300 hover:shadow-lg hover:border-opacity-80" style={{ borderColor: '#42551C' }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center text-white text-base sm:text-lg lg:text-xl font-bold shadow-lg" style={{ backgroundColor: '#42551C' }}>
                DP
              </div>
              <div className="mb-3 sm:mb-4">
                <p className="font-bold text-sm sm:text-base tracking-wide" style={{ color: '#1C1C1C' }}>David Park</p>
                <p className="text-xs sm:text-sm font-medium" style={{ color: '#42551C' }}>Operations Director, Resort Group</p>
              </div>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#1C1C1C' }}>
                &quot;The ROI calculations were incredibly accurate. We implemented 4 automations 
                and hit the projected savings within 6 weeks.&quot;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section - Mobile Optimized */}
      <div className="py-8 sm:py-12 lg:py-16" style={{ backgroundColor: '#1C1C1C' }}>
        <div className="container mx-auto px-3 sm:px-4 text-center">
          <h2 
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2 sm:px-0"
            style={{ 
              fontFamily: '"Gefika", "Bebas Neue", "Oswald", Impact, sans-serif'
            }}
          >
            READY TO LEVEL UP YOUR HOSPITALITY OPERATIONS?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0" style={{ color: '#EAE8DD' }}>
            Start your free automation analysis now and join the dojo of successful hospitality professionals.
          </p>
          
          <div className="flex flex-col gap-3 sm:gap-4 justify-center max-w-sm sm:max-w-md mx-auto px-2 sm:px-0">
            <button
              onClick={handleAuthSignUp}
              className="hd-button hd-button--primary w-full px-6 sm:px-8 py-3 sm:py-4 text-white font-bold rounded-xl flex items-center justify-center"
              style={{ minHeight: '48px' }}
            >
              <UserPlus className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="text-sm sm:text-base tracking-wide">Join the Dojo</span>
              <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            </button>
            <button
              onClick={() => router.push('/demo')}
              className="hd-touch-feedback w-full px-6 sm:px-8 py-3 sm:py-4 border-2 font-semibold rounded-xl transition-all duration-200 hover:bg-opacity-10"
              style={{
                borderColor: '#42551C',
                color: '#42551C',
                backgroundColor: 'transparent',
                minHeight: '48px'
              }}
            >
              <span className="text-sm sm:text-base tracking-wide">Watch Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer - Mobile Optimized */}
      <footer className="py-6 sm:py-8" style={{ backgroundColor: '#EAE8DD' }}>
        <div className="container mx-auto px-3 sm:px-4 text-center">
          <p className="text-xs sm:text-sm" style={{ color: '#1C1C1C' }}>
            © 2025 Hospo Dojo • Built for Hospitality Professionals
          </p>
        </div>
      </footer>
    </div>
  )
}

export default HospoDojoBrandedLanding