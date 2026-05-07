import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Eye, Zap, BarChart3, FlaskConical, TrendingUp
} from 'lucide-react'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/watchlist', icon: Eye, label: 'Watchlist' },
  { to: '/signals', icon: Zap, label: 'AI Signals' },
  { to: '/performance', icon: BarChart3, label: 'Model Performance' },
  { to: '/backtest', icon: FlaskConical, label: 'Backtesting' },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-dark-800 border-r border-white/5 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">AI Stock</p>
            <p className="text-xs text-slate-400 leading-tight">Signal Predictor</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-slate-500">Mini Project v1.0</p>
          <p className="text-xs text-blue-400 font-medium mt-0.5">NSE Markets</p>
        </div>
      </div>
    </aside>
  )
}
