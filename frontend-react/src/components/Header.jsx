import React from 'react'
import { Link, useLocation } from 'react-router-dom'

function Header({ onCenterAll, onToggleConfig, onRefresh }) {
  const location = useLocation()

  return (
    <header className="px-10 py-8 bg-gradient-to-br from-slate-700 to-blue-600 text-white flex justify-between items-center flex-wrap gap-5">
      <h1 className="text-4xl font-light">XSRT Test Bench Control Panel</h1>
      <div className="flex gap-2.5 flex-wrap">
        <Link 
          to="/" 
          className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 border-2 no-underline inline-block
            ${location.pathname === '/' 
              ? 'bg-white/40 border-white/60 shadow-lg' 
              : 'bg-white/20 border-white/30 hover:bg-white/30 hover:-translate-y-0.5'
            }`}
        >
          🏠 Home
        </Link>
        {onCenterAll && (
          <button 
            onClick={onCenterAll} 
            className="px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 bg-white/20 border-2 border-white/30 hover:bg-white/30 hover:-translate-y-0.5"
          >
            Center All
          </button>
        )}
        <Link 
          to="/webcam" 
          className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 border-2 no-underline inline-block
            ${location.pathname === '/webcam' 
              ? 'bg-white/40 border-white/60 shadow-lg' 
              : 'bg-white/20 border-white/30 hover:bg-white/30 hover:-translate-y-0.5'
            }`}
        >
          📹 Webcam
        </Link>
        <Link 
          to="/health" 
          className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 border-2 no-underline inline-block
            ${location.pathname === '/health' 
              ? 'bg-white/40 border-white/60 shadow-lg' 
              : 'bg-white/20 border-white/30 hover:bg-white/30 hover:-translate-y-0.5'
            }`}
        >
          💻 Health
        </Link>
        {onToggleConfig && (
          <button 
            onClick={onToggleConfig} 
            className="px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 bg-purple-600/80 border-2 border-purple-600 hover:bg-purple-700/80 hover:-translate-y-0.5"
          >
            ⚙️ Config
          </button>
        )}
        <button 
          onClick={onRefresh} 
          className="px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 bg-emerald-500/80 border-2 border-emerald-500 hover:bg-emerald-600/80 hover:-translate-y-0.5"
        >
          🔄 Refresh
        </button>
      </div>
    </header>
  )
}

export default Header
