import { useState, useEffect } from 'react'
import { checkHealth } from '../../services/api'

function HealthPage() {
  const [healthData, setHealthData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHealth()
    const interval = setInterval(loadHealth, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadHealth = async () => {
    try {
      const data = await checkHealth()
      setHealthData(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load health data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-5">
        <h2 className="text-slate-700 mb-8 text-center">System Health</h2>
        <p>Loading...</p>
      </div>
    )
  }

  const getStatusClasses = () => {
    const base = "inline-block px-5 py-2.5 rounded font-bold uppercase text-lg"
    switch(healthData?.status) {
      case 'healthy':
        return `${base} bg-green-100 text-green-800 border border-green-200`
      case 'degraded':
        return `${base} bg-yellow-100 text-yellow-800 border border-yellow-200`
      default:
        return `${base} bg-red-100 text-red-800 border border-red-200`
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-5">
      <h2 className="text-slate-700 mb-8 text-center text-3xl">System Health</h2>
      
      <div className="bg-white rounded-lg p-5 mb-5 shadow-sm">
        <h3 className="text-gray-700 mt-0 mb-4 text-xl border-b-2 border-gray-100 pb-2.5">Status</h3>
        <div className={getStatusClasses()}>
          {healthData?.status || 'Unknown'}
        </div>
      </div>

      <div className="bg-white rounded-lg p-5 mb-5 shadow-sm">
        <h3 className="text-gray-700 mt-0 mb-4 text-xl border-b-2 border-gray-100 pb-2.5">Backend Information</h3>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="p-3 border-b border-gray-100 font-semibold text-gray-600 w-[40%]">Backend Status</td>
              <td className={`p-3 border-b border-gray-100 text-slate-700 ${healthData?.backend_running ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}`}>
                {healthData?.backend_running ? '✅ Running' : '❌ Not Running'}
              </td>
            </tr>
            {healthData?.backend_url && (
              <tr>
                <td className="p-3 border-b border-gray-100 font-semibold text-gray-600 w-[40%]">Backend URL</td>
                <td className="p-3 border-b border-gray-100 text-slate-700">{healthData.backend_url}</td>
              </tr>
            )}
            {healthData?.timestamp && (
              <tr>
                <td className="p-3 font-semibold text-gray-600 w-[40%]">Last Check</td>
                <td className="p-3 text-slate-700">{new Date(healthData.timestamp).toLocaleString()}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {healthData?.servo_count !== undefined && (
        <div className="bg-white rounded-lg p-5 mb-5 shadow-sm">
          <h3 className="text-gray-700 mt-0 mb-4 text-xl border-b-2 border-gray-100 pb-2.5">Servo Information</h3>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="p-3 font-semibold text-gray-600 w-[40%]">Total Servos</td>
                <td className="p-3 text-slate-700">{healthData.servo_count}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default HealthPage
