import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import GlobalStatus from './components/GlobalStatus'
import HomePage from './pages/home/page'
import HealthPage from './pages/health/page'
import WebcamPage from './pages/webcam/page'
import { getServos, checkHealth } from './services/api'

function AppContent() {
  const [isAnyServoMoving, setIsAnyServoMoving] = useState(false)
  const [globalStatus, setGlobalStatus] = useState({ message: '🔄 Loading...', type: 'default' })
  const [connectionStatus, setConnectionStatus] = useState('🔄 Connecting...')
  const [servoCount, setServoCount] = useState(0)
  const location = useLocation()

  // Set up periodic status updates
  useEffect(() => {
    updateConnectionStatus()
    updateServoCount()

    const statusInterval = setInterval(updateConnectionStatus, 10000)
    const servoInterval = setInterval(updateServoCount, 5000)

    return () => {
      clearInterval(statusInterval)
      clearInterval(servoInterval)
    }
  }, [])

  const updateConnectionStatus = async () => {
    try {
      const data = await checkHealth()
      if (data.status === 'healthy') {
        setConnectionStatus('✅ Connected')
      } else {
        setConnectionStatus('⚠️ Degraded')
      }
    } catch (error) {
      setConnectionStatus('❌ Disconnected')
    }
  }

  const updateServoCount = async () => {
    try {
      const data = await getServos()
      if (data.success) {
        const enabledCount = data.servos.filter(s => s.enabled).length
        setServoCount(enabledCount)
      }
    } catch (error) {
      console.error('Error updating servo count:', error)
    }
  }

  const showGlobalStatus = (message, type = 'default') => {
    setGlobalStatus({ message, type })
    setTimeout(() => {
      setGlobalStatus({ message: connectionStatus, type: 'default' })
    }, 3000)
  }

  // Set up handlers for HomePage
  useEffect(() => {
    window.homePageHandlers = {}
  }, [])

  const handleCenterAll = () => {
    if (window.homePageHandlers?.centerAll) {
      window.homePageHandlers.centerAll()
    }
  }

  const handleToggleConfig = () => {
    if (window.homePageHandlers?.toggleConfig) {
      window.homePageHandlers.toggleConfig()
    }
  }

  const handleRefresh = () => {
    if (window.homePageHandlers?.refresh) {
      window.homePageHandlers.refresh()
    } else {
      showGlobalStatus('Refreshing...', 'default')
      updateConnectionStatus()
      updateServoCount()
    }
  }

  // Only show header actions on home page
  const isHomePage = location.pathname === '/'

  return (
    <div className="max-w-7xl mx-auto bg-white/95 rounded-3xl shadow-2xl backdrop-blur-lg overflow-hidden">
      <Header
        onCenterAll={isHomePage ? handleCenterAll : null}
        onToggleConfig={isHomePage ? handleToggleConfig : null}
        onRefresh={handleRefresh}
      />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              showGlobalStatus={showGlobalStatus}
              isAnyServoMoving={isAnyServoMoving}
              setIsAnyServoMoving={setIsAnyServoMoving}
            />
          }
        />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/webcam" element={<WebcamPage />} />
      </Routes>

      <GlobalStatus
        connectionStatus={connectionStatus}
        servoCount={servoCount}
        globalStatus={globalStatus}
      />
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
