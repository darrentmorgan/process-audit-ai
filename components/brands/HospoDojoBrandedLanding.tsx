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
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <div className="flex items-center">
            <img 
              src="/Hospo-Dojo-Logo.svg" 
              alt="Hospo Dojo - Hospitality Operations Platform"
              className="h-8 w-auto object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          
          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSignIn}
              className="flex items-center px-4 py-2 text-white hover:text-yellow-200 transition-colors duration-200"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </button>
            <button
              onClick={handleAuthSignUp}
              className="flex items-center px-6 py-2 bg-white bg-opacity-20 backdrop-blur-md rounded-lg border border-white border-opacity-30 text-white hover:bg-opacity-30 transition-all duration-200"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Join the Dojo
            </button>
          </div>
        </div>

        {/* Hero Content - Matching Original Layout */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left">
              <h1 
                className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
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
              
              <p className="text-xl mb-8 leading-relaxed" style={{ color: '#EAE8DD' }}>
                <strong>Be battle-ready with actionable frameworks and mentors.</strong> AI-powered process analysis 
                that identifies hidden automation opportunities in your hospitality business. 
                Get precise ROI calculations and step-by-step implementation plans in minutes.
              </p>

              <div className="flex flex-wrap gap-4 mb-10 justify-center lg:justify-start">
                <div className="flex items-center text-green-300">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span>5-Minute Analysis</span>
                </div>
                <div className="flex items-center text-green-300">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span>Precise ROI Calculations</span>
                </div>
                <div className="flex items-center text-green-300">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span>Implementation Roadmaps</span>
                </div>
              </div>

              {/* Call to Action Options */}
              <div className="max-w-md mx-auto lg:mx-0">
                <div className="flex flex-col gap-4 mb-6">
                  {/* Primary CTA - Join the Dojo */}
                  <button
                    onClick={handleAuthSignUp}
                    className="w-full px-8 py-4 text-white font-bold rounded-xl transition-all duration-200 text-lg flex items-center justify-center shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, #42551C 0%, #1C1C1C 100%)`,
                      border: '2px solid #EAE8DD'
                    }}
                  >
                    <UserPlus className="mr-3 h-6 w-6" />
                    Join the Dojo - Start Free Analysis
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </button>
                  
                  {/* Secondary CTA - Join Waitlist */}
                  {!isSubmitted ? (
                    <div className="text-center">
                      <p className="text-sm mb-3" style={{ color: '#EAE8DD' }}>
                        Or join our waitlist for updates
                      </p>
                      <form onSubmit={handleSignUp} className="flex gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="flex-1 px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                          style={{ backgroundColor: 'rgba(234, 232, 221, 0.1)' }}
                          required
                        />
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-6 py-3 backdrop-blur-md border border-white border-opacity-30 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                          style={{ backgroundColor: 'rgba(66, 85, 28, 0.8)' }}
                        >
                          {isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            'Join'
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
                      <p style={{ color: '#EAE8DD' }}>You're on the waitlist!</p>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-center" style={{ color: '#EAE8DD' }}>
                  <strong>Free to start</strong> • Save your results • No credit card required
                </p>
              </div>
            </div>

            {/* Right Column - Visual Demo */}
            <div className="relative">
              <div 
                className="backdrop-blur-md rounded-3xl p-8 border"
                style={{ 
                  backgroundColor: 'rgba(234, 232, 221, 0.1)',
                  borderColor: 'rgba(234, 232, 221, 0.3)'
                }}
              >
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-4">See What You'll Get:</h3>
                </div>

                {/* Mock Analysis Results - Hospitality Focused */}
                <div className="space-y-4">
                  <div 
                    className="rounded-xl p-4 text-white"
                    style={{ background: `linear-gradient(135deg, #42551C 0%, #1C1C1C 100%)` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <TrendingUp className="w-6 h-6 mr-3" />
                        <div>
                          <p className="font-semibold">Automate Guest Check-in</p>
                          <p className="text-sm opacity-90">90% Priority Score</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">$18K/year</p>
                        <p className="text-sm opacity-90">savings</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="rounded-xl p-4"
                    style={{ 
                      backgroundColor: 'rgba(234, 232, 221, 0.2)',
                      color: '#1C1C1C'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="w-6 h-6 mr-3" />
                        <div>
                          <p className="font-semibold">Staff Scheduling Optimization</p>
                          <p className="text-sm opacity-75">82% Priority Score</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">12 hours/week</p>
                        <p className="text-sm opacity-75">saved</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="rounded-xl p-4"
                    style={{ 
                      backgroundColor: 'rgba(234, 232, 221, 0.2)',
                      color: '#1C1C1C'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <BarChart3 className="w-6 h-6 mr-3" />
                        <div>
                          <p className="font-semibold">Inventory Management</p>
                          <p className="text-sm opacity-75">78% Priority Score</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">8 hours/week</p>
                        <p className="text-sm opacity-75">saved</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROI Summary */}
                <div 
                  className="mt-6 p-4 rounded-xl border-2"
                  style={{ 
                    borderColor: '#42551C',
                    backgroundColor: 'rgba(234, 232, 221, 0.1)'
                  }}
                >
                  <div className="grid grid-cols-3 gap-4 text-center text-white text-sm">
                    <div>
                      <div className="font-semibold" style={{ color: '#EAE8DD' }}>Total Annual Savings:</div>
                      <div className="font-bold text-xl">$32,000</div>
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: '#EAE8DD' }}>Implementation Cost:</div>
                      <div className="font-bold text-xl">$3,200</div>
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: '#EAE8DD' }}>ROI:</div>
                      <div className="font-bold text-xl text-green-300">900%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: '#EAE8DD' }}></div>
              <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: '#42551C' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16" style={{ backgroundColor: '#EAE8DD' }}>
        <div className="container mx-auto px-4">
          <h2 
            className="text-4xl font-bold text-center mb-16"
            style={{ 
              color: '#1C1C1C',
              fontFamily: '"Gefika", "Bebas Neue", "Oswald", Impact, sans-serif'
            }}
          >
            HOW HOSPO DOJO WORKS
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#42551C' }}
              >
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 
                className="text-xl font-bold mb-3"
                style={{ 
                  color: '#1C1C1C',
                  fontFamily: '"Nimbus Sans", "Helvetica Neue", Arial, sans-serif'
                }}
              >
                1. Describe Your Process
              </h3>
              <p style={{ color: '#1C1C1C' }}>
                Simply tell us about any hospitality process - from guest check-in to inventory management. 
                Our AI asks smart follow-up questions to understand the details.
              </p>
            </div>

            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#42551C' }}
              >
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 
                className="text-xl font-bold mb-3"
                style={{ 
                  color: '#1C1C1C',
                  fontFamily: '"Nimbus Sans", "Helvetica Neue", Arial, sans-serif'
                }}
              >
                2. AI Analysis
              </h3>
              <p style={{ color: '#1C1C1C' }}>
                Our advanced AI analyzes your hospitality operations, identifies automation opportunities, 
                and creates frameworks for consistent service excellence.
              </p>
            </div>

            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#42551C' }}
              >
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 
                className="text-xl font-bold mb-3"
                style={{ 
                  color: '#1C1C1C',
                  fontFamily: '"Nimbus Sans", "Helvetica Neue", Arial, sans-serif'
                }}
              >
                3. Get Your Battle Plan
              </h3>
              <p style={{ color: '#1C1C1C' }}>
                Receive a prioritized list of automation opportunities with exact tools, costs, 
                timelines, and step-by-step implementation guides for hospitality excellence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-16" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="container mx-auto px-4">
          <h2 
            className="text-4xl font-bold text-center mb-16"
            style={{ 
              color: '#1C1C1C',
              fontFamily: '"Gefika", "Bebas Neue", "Oswald", Impact, sans-serif'
            }}
          >
            TRUSTED BY HOSPITALITY PROFESSIONALS
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center p-6 rounded-lg border-2" style={{ borderColor: '#42551C' }}>
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: '#42551C' }}>
                JS
              </div>
              <div className="mb-4">
                <p className="font-bold" style={{ color: '#1C1C1C' }}>James Smith</p>
                <p className="text-sm" style={{ color: '#42551C' }}>Hotel Manager, Boutique Stays</p>
              </div>
              <p style={{ color: '#1C1C1C' }}>
                "Hospo Dojo identified $45K in annual savings we never knew existed. 
                The implementation roadmap was perfect for our hotel operations."
              </p>
            </div>

            <div className="text-center p-6 rounded-lg border-2" style={{ borderColor: '#42551C' }}>
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: '#42551C' }}>
                MJ
              </div>
              <div className="mb-4">
                <p className="font-bold" style={{ color: '#1C1C1C' }}>Maria Johnson</p>
                <p className="text-sm" style={{ color: '#42551C' }}>Restaurant Owner, Fine Dining Co</p>
              </div>
              <p style={{ color: '#1C1C1C' }}>
                "Finally, an AI tool that actually understands hospitality workflows. 
                Saved us 25 hours per week on staff scheduling and inventory!"
              </p>
            </div>

            <div className="text-center p-6 rounded-lg border-2" style={{ borderColor: '#42551C' }}>
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: '#42551C' }}>
                DP
              </div>
              <div className="mb-4">
                <p className="font-bold" style={{ color: '#1C1C1C' }}>David Park</p>
                <p className="text-sm" style={{ color: '#42551C' }}>Operations Director, Resort Group</p>
              </div>
              <p style={{ color: '#1C1C1C' }}>
                "The ROI calculations were incredibly accurate. We implemented 4 automations 
                and hit the projected savings within 6 weeks."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-16" style={{ backgroundColor: '#1C1C1C' }}>
        <div className="container mx-auto px-4 text-center">
          <h2 
            className="text-4xl font-bold text-white mb-6"
            style={{ 
              fontFamily: '"Gefika", "Bebas Neue", "Oswald", Impact, sans-serif'
            }}
          >
            READY TO LEVEL UP YOUR HOSPITALITY OPERATIONS?
          </h2>
          <p className="text-xl mb-8" style={{ color: '#EAE8DD' }}>
            Start your free automation analysis now and join the dojo of successful hospitality professionals.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <button
              onClick={handleAuthSignUp}
              className="px-8 py-4 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center"
              style={{
                backgroundColor: '#42551C',
                border: '2px solid #EAE8DD'
              }}
            >
              <UserPlus className="mr-3 h-6 w-6" />
              Join the Dojo
              <ArrowRight className="ml-3 h-6 w-6" />
            </button>
            <button
              onClick={() => router.push('/demo')}
              className="px-8 py-4 border-2 font-semibold rounded-xl transition-all duration-200"
              style={{
                borderColor: '#42551C',
                color: '#42551C',
                backgroundColor: 'transparent'
              }}
            >
              Watch Demo
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8" style={{ backgroundColor: '#EAE8DD' }}>
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm" style={{ color: '#1C1C1C' }}>
            © 2025 Hospo Dojo • Built for Hospitality Professionals
          </p>
        </div>
      </footer>
    </div>
  )
}

export default HospoDojoBrandedLanding