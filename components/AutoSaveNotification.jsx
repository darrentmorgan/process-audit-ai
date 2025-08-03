import { useState, useEffect } from 'react'
import { CheckCircle, X } from 'lucide-react'

const AutoSaveNotification = ({ show, message, type = 'success', onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-up">
      <div className={`
        flex items-center p-4 rounded-lg shadow-lg border max-w-sm
        ${type === 'success' 
          ? 'bg-green-50 border-green-200 text-green-800' 
          : type === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }
      `}>
        {type === 'success' && <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />}
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className={`ml-3 flex-shrink-0 ${
            type === 'success' 
              ? 'text-green-600 hover:text-green-800' 
              : type === 'error'
                ? 'text-red-600 hover:text-red-800'
                : 'text-blue-600 hover:text-blue-800'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default AutoSaveNotification