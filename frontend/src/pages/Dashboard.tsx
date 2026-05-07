import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Zap, BarChart3, Activity, RefreshCw } from 'lucide-react'
import { getStocks, getSignals } from '../services/api'
import type { StockInfo, Signal } from '../types'
import StatCard from '../components/StatCard'
import SignalCard from '../components/SignalCard'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'

export default function Dashboard() {
  const [stocks, setStocks] = useState<StockInfo[]>([])
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [sigLoading, setSigLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getStocks()
      .then(setStocks)
      .catch(() => setError('Failed to load stocks. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  const loadSignals = () => {
    setSigLoading(true)
    getSignals()
      .then(setSignals)
      .catch(() => setError('Failed to generate signals'))
      .finally(() => setSigLoading(false))
  }

  const buyCount = signals.filter(s => s.signal === 'BUY').length
  const sellCount = signals.filter(s => s.signal === 'SELL').length
  const holdCount = signals.filter(s => s.signal === 'HOLD').length
  const avgConf = signals.length
    ? Math.round(signals.reduce((a, s) => a + (s.confidence ?? 0), 0) / signals.length)
    : 0

  if (loading) return <LoadingSpinner text="Fetching market data..." />

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Real-time AI-powered NSE market overview"
        action={
          <button onClick={loadSignals} disabled={sigLoading} className="btn-primary">
            <RefreshCw size={16} className={sigLoading ? 'animate-spin' : ''} />
            {sigLoading ? 'Generating...' : 'Generate Signals'}
          </button>
        }
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Market sentiment banner */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 border border-blue-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity size={20} className="text-blue-400 animate-pulse" />
          <div>
            <p className="text-white font-semibold text-sm">Market Sentiment</p>
            <p className="text-slate-400 text-xs">NSE Indices — Live AI Analysis</p>
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-emerald-400 font-semibold">{buyCount} BUY</span>
          <span className="text-red-400 font-semibold">{sellCount} SELL</span>
          <span className="text-amber-400 font-semibold">{holdCount} HOLD</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Stocks Tracked" value={stocks.length} icon={<BarChart3 size={18} />} color="blue" />
        <StatCard title="BUY Signals" value={buyCount} icon={<TrendingUp size={18} />} color="green" />
        <StatCard title="SELL Signals" value={sellCount} icon={<TrendingDown size={18} />} color="red" />
        <StatCard title="Avg Confidence" value={`${avgConf}%`} icon={<Zap size={18} />} color="purple" />
      </div>

      {/* Stock prices */}
      <div className="glass-card p-5 mb-8">
        <p className="text-white font-semibold mb-4">NSE Stocks</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs border-b border-white/5">
                <th className="text-left pb-3">Symbol</th>
                <th className="text-right pb-3">Price</th>
                <th className="text-right pb-3">Change</th>
                <th className="text-right pb-3">Volume</th>
                <th className="text-right pb-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stocks.map(s => (
                <tr key={s.symbol} className="hover:bg-white/2 transition-colors">
                  <td className="py-3">
                    <p className="text-white font-semibold">{s.name}</p>
                    <p className="text-slate-500 text-xs">{s.symbol}</p>
                  </td>
                  <td className="py-3 text-right font-mono text-white">
                    {s.price ? `₹${s.price.toLocaleString()}` : '—'}
                  </td>
                  <td className={`py-3 text-right font-semibold ${s.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {s.change >= 0 ? '+' : ''}{s.change}%
                  </td>
                  <td className="py-3 text-right text-slate-400 font-mono text-xs">
                    {s.volume ? (s.volume / 1e6).toFixed(2) + 'M' : '—'}
                  </td>
                  <td className="py-3 text-right text-slate-500 text-xs">{s.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signal cards */}
      {signals.length > 0 && (
        <div>
          <p className="text-white font-semibold mb-4">Latest AI Signals</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {signals.map(s => <SignalCard key={s.symbol} signal={s} />)}
          </div>
        </div>
      )}
    </div>
  )
}
