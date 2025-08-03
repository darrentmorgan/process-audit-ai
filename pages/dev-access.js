import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function DevAccess() {
  const router = useRouter()

  useEffect(() => {
    // Automatically redirect to app with access granted
    router.push('/?access=granted')
  }, [router])

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="text-white text-xl">Redirecting to app...</div>
    </div>
  )
}