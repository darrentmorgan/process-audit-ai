import { CheckCircle } from 'lucide-react'

const StepIndicator = ({ currentStep, steps }) => {
  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < Math.ceil(currentStep)
          const isCurrent = stepNumber === Math.ceil(currentStep)
          const isUpcoming = stepNumber > Math.ceil(currentStep)

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex items-center">
                <div
                  className={`
                    relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                    ${isCompleted 
                      ? 'bg-secondary border-secondary text-white' 
                      : isCurrent 
                        ? 'bg-primary border-primary text-white' 
                        : 'bg-white border-gray-300 text-gray-500'
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-semibold">{stepNumber}</span>
                  )}
                </div>
                
                {/* Step Label */}
                <div className="ml-3 hidden sm:block">
                  <p
                    className={`
                      text-sm font-medium transition-colors duration-300
                      ${isCompleted || isCurrent ? 'text-white' : 'text-blue-200'}
                    `}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-blue-200">{step.description}</p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div
                    className={`
                      h-0.5 transition-colors duration-300
                      ${isCompleted ? 'bg-secondary' : 'bg-gray-300'}
                    `}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile Step Labels */}
      <div className="sm:hidden mt-4">
        <p className="text-sm font-medium text-white">
          {steps[Math.ceil(currentStep) - 1]?.title}
        </p>
        <p className="text-xs text-blue-200">
          {steps[Math.ceil(currentStep) - 1]?.description}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between text-xs text-blue-200 mb-2">
          <span>Step {Math.ceil(currentStep)} of {steps.length}</span>
          <span>{Math.round((Math.ceil(currentStep) / steps.length) * 100)}% Complete</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(Math.ceil(currentStep) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default StepIndicator