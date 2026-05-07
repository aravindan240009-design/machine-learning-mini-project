import type { ReactNode } from 'react'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  trend?: number
  color?: string
}

export default function StatCard({ title, value, subtitle, icon, trend, color = 'blue' }: Props) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
    green: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
    red: 'from-red-500/20 to-red-600/5 border-red-500/20',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20',
    yellow: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
  }
  const iconMap: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-emerald-500/20 text-emerald-400',
    red: 'bg-red-500/20 text-red-400',
    purple: 'bg-purple-500/20 text-purple-400',
    yellow: 'bg-amber-500/20 text-amber-400',
  }

  return (
    <div className={`rounded-2xl p-5 bg-gradient-to-br border ${colorMap[color]} hover:scale-[1.02] transition-all duration-300`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconMap[color]}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-slate-400 text-xs font-medium mb-1">{title}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
    </div>
  )
}
