import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react'
import type { Signal } from '../types'

interface Props { signal: Signal }

const config = {
  BUY:  { cls: 'signal-buy',  icon: TrendingUp,   dot: 'bg-emerald-400', label: '▲ BUY'  },
  SELL: { cls: 'signal-sell', icon: TrendingDown,  dot: 'bg-red-400',     label: '▼ SELL' },
  HOLD: { cls: 'signal-hold', icon: Minus,         dot: 'bg-amber-400',   label: '◆ HOLD' },
}

export default function SignalCard({ signal }: Props) {
  if (signal.error) {
    return (
      <div className="glass-card p-5 border-red-500/20">
        <p className="text-slate-400 text-sm">{signal.symbol}</p>
        <p className="text-red-400 text-xs mt-1">{signal.error}</p>
      </div>
    )
  }

  const { cls, icon: Icon, dot, label } = config[signal.signal]
  const ts = new Date(signal.timestamp + 'Z').toLocaleTimeString()

  return (
    <div className={`glass-card p-5 hover:scale-[1.01] transition-all duration-300 animate-slide-up`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-white font-bold text-lg">{signal.name}</p>
          <p className="text-slate-500 text-xs">{signal.symbol}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${cls} flex items-center gap-1.5`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />
          {label}
        </span>
      </div>

      {/* Confidence bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-400">AI Confidence</span>
          <span className="text-white font-semibold">{signal.confidence}%</span>
        </div>
        <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              signal.signal === 'BUY' ? 'bg-emerald-500' :
              signal.signal === 'SELL' ? 'bg-red-500' : 'bg-amber-500'
            }`}
            style={{ width: `${signal.confidence}%` }}
          />
        </div>
      </div>

      {/* Price grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Entry', value: `₹${signal.entry_price.toLocaleString()}` },
          { label: 'Stop Loss', value: `₹${signal.stop_loss.toLocaleString()}` },
          { label: 'Target', value: `₹${signal.target_price.toLocaleString()}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-dark-700/50 rounded-lg p-2.5 text-center">
            <p className="text-slate-500 text-xs mb-0.5">{label}</p>
            <p className="text-white text-xs font-semibold font-mono">{value}</p>
          </div>
        ))}
      </div>

      {/* Predicted move + timestamp */}
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${signal.predicted_move >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {signal.predicted_move >= 0 ? '+' : ''}{signal.predicted_move}% move
        </span>
        <span className="text-slate-500 text-xs flex items-center gap-1">
          <Clock size={11} /> {ts}
        </span>
      </div>

      {/* Probability bars */}
      {signal.probabilities && (
        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-2">
          {(['BUY', 'HOLD', 'SELL'] as const).map(s => (
            <div key={s} className="text-center">
              <p className="text-slate-500 text-xs mb-1">{s}</p>
              <p className={`text-xs font-bold ${
                s === 'BUY' ? 'text-emerald-400' : s === 'SELL' ? 'text-red-400' : 'text-amber-400'
              }`}>{signal.probabilities[s]}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
