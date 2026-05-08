import { useState } from 'react'
import { LandingScreen } from '@/components/UI/LandingScreen'
import { GreenGridDemoPage } from '@/components/Demo/GreenGridDemoPage'

export default function App() {
  const [showLanding, setShowLanding] = useState(true)

  return (
    <div style={{ background: '#030D08', height: '100vh', overflow: 'hidden' }}>
      {showLanding ? (
        <LandingScreen onEnter={() => setShowLanding(false)} />
      ) : (
        <GreenGridDemoPage />
      )}
    </div>
  )
}
