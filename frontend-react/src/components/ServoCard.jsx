import React, { useState, useEffect } from 'react'
import { setServoAngle, sweepServo } from '../services/api'

function ServoCard({ servo, isAnyServoMoving, setIsAnyServoMoving, onUpdate, showGlobalStatus }) {
  const [angle, setAngle] = useState(servo.current_position || servo.default_angle || 90)
  const [status, setStatus] = useState(`Position: ${angle}°`)
  const [statusType, setStatusType] = useState('success')
  const [isPulsing, setIsPulsing] = useState(false)

  useEffect(() => {
    setAngle(servo.current_position || servo.default_angle || 90)
  }, [servo.current_position, servo.default_angle])

  const updateStatus = (message, type = 'default') => {
    setStatus(message)
    setStatusType(type)
  }

  const handleAngleChange = async (newAngle) => {
    if (isAnyServoMoving) return

    setAngle(newAngle)
    
    // Debounce the API call
    clearTimeout(window[`timeout_${servo.id}`])
    window[`timeout_${servo.id}`] = setTimeout(async () => {
      try {
        setIsPulsing(true)
        updateStatus(`Moving to ${newAngle}°...`, 'default')

        const data = await setServoAngle(servo.id, newAngle)

        if (data.success) {
          updateStatus(`Position: ${data.angle}°`, 'success')
          onUpdate()
        } else {
          updateStatus('Error: ' + data.error, 'error')
        }
      } catch (error) {
        updateStatus('Connection error', 'error')
      } finally {
        setIsPulsing(false)
      }
    }, 150)
  }

  const handleSweep = async () => {
    if (isAnyServoMoving) {
      updateStatus('Please wait for current movement', 'error')
      return
    }

    setIsAnyServoMoving(true)
    updateStatus('Sweeping...', 'default')

    try {
      const data = await sweepServo(servo.id, { step: 15, delay: 0.05 })

      if (data.success) {
        updateStatus('Sweep complete', 'success')
        setTimeout(() => onUpdate(), 500)
      } else {
        updateStatus('Sweep failed: ' + data.message, 'error')
      }
    } catch (error) {
      updateStatus('Sweep error', 'error')
    } finally {
      setIsAnyServoMoving(false)
    }
  }

  const handleIncrement = (delta) => {
    const newAngle = Math.min(servo.max_angle, Math.max(servo.min_angle, angle + delta))
    handleAngleChange(newAngle)
  }

  const getStatusClasses = () => {
    const base = "p-2.5 rounded-lg text-center font-semibold mt-4"
    switch(statusType) {
      case 'success':
        return `${base} bg-green-50 text-green-600`
      case 'error':
        return `${base} bg-red-50 text-red-600`
      default:
        return `${base} bg-gray-100 text-slate-600`
    }
  }

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${!servo.enabled ? 'opacity-60 bg-gray-50' : ''}`}>
      <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-100">
        <h3 className="text-2xl font-semibold text-slate-700">{servo.name}</h3>
        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">Ch {servo.channel}</span>
      </div>

      <div className={`text-center text-2xl font-bold text-white my-5 p-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl transition-all duration-300 ${isPulsing ? 'animate-pulse-scale' : ''}`}>
        {angle}°
      </div>

      <div className="my-5">
        <label className="block mb-2.5 font-semibold text-slate-600">Position Control</label>
        <div className="flex items-center gap-2.5">
          <button
            className="px-3 py-2 bg-gradient-to-br from-blue-400 to-blue-600 border-none text-white rounded font-semibold transition-all duration-200 min-w-[50px] hover:from-blue-600 hover:to-blue-800 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            onClick={() => handleIncrement(-5)}
            disabled={isAnyServoMoving}
          >
            -5°
          </button>
          <input
            type="range"
            min={servo.min_angle}
            max={servo.max_angle}
            value={angle}
            onChange={(e) => handleAngleChange(parseInt(e.target.value))}
            className="flex-1 h-2 rounded appearance-none outline-none bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 disabled:opacity-50 disabled:cursor-not-allowed
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:bg-blue-700 [&::-webkit-slider-thumb]:hover:scale-110
              [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-md"
            disabled={isAnyServoMoving}
          />
          <button
            className="px-3 py-2 bg-gradient-to-br from-blue-400 to-blue-600 border-none text-white rounded font-semibold transition-all duration-200 min-w-[50px] hover:from-blue-600 hover:to-blue-800 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            onClick={() => handleIncrement(5)}
            disabled={isAnyServoMoving}
          >
            +5°
          </button>
        </div>
        <div className="flex justify-between text-gray-500 text-sm mt-1">
          <span>{servo.min_angle}°</span>
          <span>{servo.max_angle}°</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5 my-5 max-[480px]:grid-cols-2">
        <button
          onClick={() => handleAngleChange(servo.min_angle)}
          className="px-4 py-2.5 border-none text-white rounded-lg font-semibold transition-all duration-300 text-sm bg-gradient-to-br from-red-500 to-red-700 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          disabled={isAnyServoMoving}
        >
          Min
        </button>
        <button
          onClick={() => handleAngleChange((servo.min_angle + servo.max_angle) / 2)}
          className="px-4 py-2.5 border-none text-white rounded-lg font-semibold transition-all duration-300 text-sm bg-gradient-to-br from-yellow-500 to-orange-600 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          disabled={isAnyServoMoving}
        >
          Center
        </button>
        <button
          onClick={() => handleAngleChange(servo.max_angle)}
          className="px-4 py-2.5 border-none text-white rounded-lg font-semibold transition-all duration-300 text-sm bg-gradient-to-br from-green-500 to-green-700 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          disabled={isAnyServoMoving}
        >
          Max
        </button>
        <button
          onClick={handleSweep}
          className="px-4 py-2.5 border-none text-white rounded-lg font-semibold transition-all duration-300 text-sm bg-gradient-to-br from-purple-500 to-purple-700 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          disabled={isAnyServoMoving}
        >
          🔄 Sweep
        </button>
      </div>

      <div className={getStatusClasses()}>
        {status}
      </div>
    </div>
  )
}

export default ServoCard
