import React from 'react'

function GlobalStatus({ connectionStatus, servoCount, globalStatus }) {
  const getStatusClasses = () => {
    const base = "inline-block px-4 py-2 rounded-full transition-all duration-300"
    switch(globalStatus.type) {
      case 'success':
        return `${base} bg-green-600/30`
      case 'error':
        return `${base} bg-red-600/30`
      default:
        return `${base} bg-white/10`
    }
  }

  return (
    <div className="px-10 py-5 bg-gradient-to-br from-slate-700 to-slate-600 flex justify-between items-center text-white font-semibold flex-wrap gap-4">
      <span className={getStatusClasses()}>
        {globalStatus.message}
      </span>
      <span className="text-white/90">
        {servoCount} servo{servoCount !== 1 ? 's' : ''} active
      </span>
    </div>
  )
}

export default GlobalStatus
