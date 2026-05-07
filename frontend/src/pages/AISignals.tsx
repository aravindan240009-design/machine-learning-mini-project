import { useState } from 'react'
import { Zap, RefreshCw, Clock } from 'lucide-react'
import { getSignals } from '../services/api'
import type { Signal } from '../types'
import SignalCard from '../components/SignalCard'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'

export default function AISignals() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const generate = () => {
    setLoading(true)
    setError('')
    getSignals()
      .then(data => {
        setSignals(data)
        setLastUpdated(new Date().toLocaleTimeString())
      })
      .catch(() => setError('Failed to generate signals. Ensure backend is running.'))
      .finally(() => setLoading(false))
  }

  const buySignals = signals.filter(s => s.signal === 'BUY')
  const sellSignals = signals.filter(s => s.signal === 'SELL')
  const holdSignals = signals.filter(s => s.signal === 'HOLD')

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="AI Signals"
        subtitle="Ensemble model predictions for NSE stocks"
        action={
          <button onClick={generate} disabled={loading} className="btn-primary">
            <Zap size={16} className={loading ? 'animate-pulse' : ''} />
            {loading ? 'Analyzing...' : 'Run AI Analysis'}
          </button>
        }
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {lastUpdated && (
        <div className="mb-6 flex items-center gap-2 text-slate-400 text-sm">
          <Clock size={14} />
          Last updated: {lastUpdated}
        </div>
      )}

      {loading ? (
        <LoadingSpinner text="Running ensemble model on all stocks..." />
      ) : signals.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Zap size={40} className="text-blue-400 mx-auto mb-4 opacity-50" />
          <p className="text-slate-400 text-lg font-medium">No signals yet</p>
          <p className="text-slate-500 text-sm mt-2">Click "Run AI Analysis" to generate predictions</p>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'BUY', count: buySignals.length, cls: 'signal-buy', dot: 'bg-emerald-400' },
              { label: 'HOLD', count: holdSignals.length, cls: 'signal-hold', dot: 'bg-amber-400' },
              { label: 'SELL', count: sellSignals.length, cls: 'signal-sell', dot: 'bg-red-400' },
            ].map(({ label, count, cls, dot }) => (
              <div key={label} className={`glass-card p-5 text-center ${cls}`}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${dot} animate-pulse`} />
                  <span className="font-bold text-lg">{count}</span>
                </div>
                <p className="text-xs font-semibold opacity-80">{label} Signals</p>
              </div>
            ))}
          </div>

          {/* Signal cards grouped */}
          {buySignals.length > 0 && (
            <section className="mb-8">
              <p className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> BUY Signals
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {buySignals.map(s => <SignalCard key={s.symbol} signal={s} />)}
              </div>
            </section>
          )}
          {holdSignals.length > 0 && (
            <section className="mb-8">
              <p className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> HOLD Signals
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {holdSignals.map(s => <SignalCard key={s.symbol} signal={s} />)}
              </div>
            </section>
          )}
          {sellSignals.length > 0 && (
            <section className="mb-8">
              <p className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> SELL Signals
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sellSignals.map(s => <SignalCard key={s.symbol} signal={s} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
