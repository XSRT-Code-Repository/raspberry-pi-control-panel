import { useState, useEffect } from 'react'
import ServoControls from '../../components/ServoControls'
import ConfigPanel from '../../components/ConfigPanel'
import { getServos, centerAllServos } from '../../services/api'

function HomePage({ showGlobalStatus, isAnyServoMoving, setIsAnyServoMoving }) {
  const [servos, setServos] = useState({})
  const [configPanelVisible, setConfigPanelVisible] = useState(false)

  // Load servos on mount
  useEffect(() => {
    loadServos()

    // Set up periodic position updates
    const positionInterval = setInterval(loadServos, 5000)

    return () => {
      clearInterval(positionInterval)
    }
  }, [])

  const loadServos = async () => {
    try {
      const data = await getServos()
      if (data.success) {
        const servosMap = {}
        data.servos.forEach(servo => {
          servosMap[servo.id] = servo
        })
        setServos(servosMap)
      } else {
        showGlobalStatus('Failed to load servos: ' + data.error, 'error')
      }
    } catch (error) {
      showGlobalStatus('Connection error', 'error')
      console.error('Error loading servos:', error)
    }
  }

  const handleCenterAll = async () => {
    if (isAnyServoMoving) {
      showGlobalStatus('Please wait for current movements', 'error')
      return
    }

    showGlobalStatus('Centering all servos...', 'default')

    try {
      const data = await centerAllServos()
      if (data.success) {
        showGlobalStatus('All servos centered', 'success')
        loadServos()
      } else {
        showGlobalStatus('Failed to center servos', 'error')
      }
    } catch (error) {
      showGlobalStatus('Connection error', 'error')
    }
  }

  const toggleConfigPanel = () => {
    setConfigPanelVisible(!configPanelVisible)
  }

  const handleRefresh = () => {
    showGlobalStatus('Refreshing...', 'default')
    loadServos()
  }

  // Expose handlers to parent via props callback
  useEffect(() => {
    if (window.homePageHandlers) {
      window.homePageHandlers.centerAll = handleCenterAll
      window.homePageHandlers.toggleConfig = toggleConfigPanel
      window.homePageHandlers.refresh = handleRefresh
    }
  }, [isAnyServoMoving, servos])

  return (
    <>
      <ServoControls
        servos={servos}
        isAnyServoMoving={isAnyServoMoving}
        setIsAnyServoMoving={setIsAnyServoMoving}
        onServoUpdate={loadServos}
        showGlobalStatus={showGlobalStatus}
      />

      <ConfigPanel
        visible={configPanelVisible}
        servos={servos}
        onServoUpdate={loadServos}
        showGlobalStatus={showGlobalStatus}
      />
    </>
  )
}

export default HomePage
