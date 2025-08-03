import { useState } from 'react'
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
  DollarSign
} from 'lucide-react'
import Logo from './Logo'

const LandingPage = ({ onSignUp }) => {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
      // You could show an error message here
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-bg overflow-hidden">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-center items-center mb-16">
          <div className="flex items-center">
            <Logo className="w-12 h-12 text-white mr-3" />
            <h1 className="text-2xl font-bold text-white">ProcessAudit AI</h1>
          </div>
        </div>

        {/* Hero Content */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Turn Your Business
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                  Processes Into
                </span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-blue-400">
                  Profit Machines
                </span>
              </h1>
              
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                AI-powered process analysis that identifies <strong>hidden automation opportunities</strong> in your business. 
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

              {/* Signup Form */}
              {!isSubmitted ? (
                <form onSubmit={handleSignUp} className="max-w-md mx-auto lg:mx-0">
                  <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 border border-white border-opacity-20">
                    <h3 className="text-lg font-semibold text-white mb-4">Get Early Access</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="flex-1 px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                          <>
                            Join Waitlist
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-blue-200 text-sm mt-3">Join 1,000+ founders optimizing their operations</p>
                  </div>
                </form>
              ) : (
                <div className="max-w-md mx-auto lg:mx-0 bg-green-500 bg-opacity-20 border border-green-400 rounded-2xl p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">You're on the list!</h3>
                  <p className="text-green-200">We'll notify you when ProcessAudit AI is ready to transform your business.</p>
                </div>
              )}
            </div>

            {/* Right Column - Visual Demo */}
            <div className="relative">
              <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-3xl p-8 border border-white border-opacity-20">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-4">See What You'll Get:</h3>
                </div>

                {/* Mock Analysis Results */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <TrendingUp className="w-6 h-6 mr-3" />
                        <div>
                          <p className="font-semibold">Automate Invoice Processing</p>
                          <p className="text-sm opacity-90">85% Priority Score</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">$12K/year</p>
                        <p className="text-sm opacity-90">savings</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Bot className="w-6 h-6 mr-3" />
                        <div>
                          <p className="font-semibold">Customer Onboarding Flow</p>
                          <p className="text-sm opacity-90">78% Priority Score</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">8 hours/week</p>
                        <p className="text-sm opacity-90">saved</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Cog className="w-6 h-6 mr-3" />
                        <div>
                          <p className="font-semibold">Report Generation</p>
                          <p className="text-sm opacity-90">72% Priority Score</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">4 hours/week</p>
                        <p className="text-sm opacity-90">saved</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white border-opacity-20">
                  <div className="flex items-center justify-between text-white">
                    <span className="font-semibold">Total Annual Savings:</span>
                    <span className="text-2xl font-bold text-green-300">$24,000</span>
                  </div>
                  <div className="flex items-center justify-between text-blue-200 mt-2">
                    <span>Implementation Cost:</span>
                    <span>$2,400</span>
                  </div>
                  <div className="flex items-center justify-between text-orange-300 mt-2 font-semibold">
                    <span>ROI:</span>
                    <span>900%</span>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-yellow-400 rounded-full p-3 animate-bounce">
                <DollarSign className="w-6 h-6 text-yellow-900" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-green-400 rounded-full p-3 animate-pulse">
                <Zap className="w-6 h-6 text-green-900" />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto mt-24">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            How ProcessAudit AI Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 mb-6 mx-auto w-20 h-20 flex items-center justify-center">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">1. Describe Your Process</h3>
              <p className="text-blue-100">
                Simply tell us about any business process - from invoice handling to customer onboarding. 
                Our AI asks smart follow-up questions to understand the details.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 mb-6 mx-auto w-20 h-20 flex items-center justify-center">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">2. AI Analysis</h3>
              <p className="text-blue-100">
                Our advanced AI analyzes your process, identifies automation opportunities, 
                calculates precise ROI, and creates implementation roadmaps.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 mb-6 mx-auto w-20 h-20 flex items-center justify-center">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">3. Get Your Roadmap</h3>
              <p className="text-blue-100">
                Receive a prioritized list of automation opportunities with exact tools, 
                costs, timelines, and step-by-step implementation guides.
              </p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="max-w-4xl mx-auto mt-24 text-center">
          <h2 className="text-3xl font-bold text-white mb-12">
            Trusted by Forward-Thinking Founders
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                  JS
                </div>
                <div className="ml-4 text-left">
                  <p className="font-semibold text-white">John Smith</p>
                  <p className="text-blue-200 text-sm">CEO, TechStartup Inc</p>
                </div>
              </div>
              <p className="text-blue-100 italic">
                "ProcessAudit AI identified $50K in annual savings we never knew existed. 
                The implementation roadmap was spot-on."
              </p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  MJ
                </div>
                <div className="ml-4 text-left">
                  <p className="font-semibold text-white">Maria Johnson</p>
                  <p className="text-blue-200 text-sm">Founder, GrowthCo</p>
                </div>
              </div>
              <p className="text-blue-100 italic">
                "Finally, an AI tool that actually understands our business processes. 
                Saved us 20 hours per week!"
              </p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                  DP
                </div>
                <div className="ml-4 text-left">
                  <p className="font-semibold text-white">David Park</p>
                  <p className="text-blue-200 text-sm">CTO, InnovateLab</p>
                </div>
              </div>
              <p className="text-blue-100 italic">
                "The ROI calculations were incredibly accurate. We implemented 3 automations 
                and hit the projected savings within 2 months."
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-2xl mx-auto mt-24 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join the waitlist and be among the first to experience AI-powered process optimization.
          </p>
          
          {!isSubmitted && (
            <button
              onClick={() => document.querySelector('input[type="email"]').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 text-lg flex items-center mx-auto"
            >
              Get Early Access
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-white border-opacity-20">
          <p className="text-blue-200">
            © 2025 ProcessAudit AI • Built for Technical Founders
          </p>
        </div>
      </div>
    </div>
  )
}

export default LandingPage