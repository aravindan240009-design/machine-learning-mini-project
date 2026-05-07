import { useState } from 'react'
import { FlaskConical, Play } from 'lucide-react'
import { runBacktest } from '../services/api'
import type { BacktestResult } from '../types'
import EquityChart from '../charts/EquityChart'
import ConfusionMatrix from '../charts/ConfusionMatrix'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'

const STOCKS = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS']

function MetricBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="glass-card p-4 text-center">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-white font-bold text-xl">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

export default function Backtesting() {
  const [selected, setSelected] = useState(STOCKS[0])
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = () => {
    setLoading(true)
    setError('')
    runBacktest(selected)
      .then(setResult)
      .catch(() => setError('Backtest failed. Ensure backend is running.'))
      .finally(() => setLoading(false))
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Backtesting"
        subtitle="Walk-forward backtest using TimeSeriesSplit (5 folds)"
      />

      {/* Controls */}
      <div className="glass-card p-5 mb-8 flex flex-wrap items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          {STOCKS.map(s => (
            <button
              key={s}
              onClick={() => setSelected(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selected === s ? 'bg-blue-600 text-white' : 'glass-card text-slate-400 hover:text-white'
              }`}
            >
              {s.replace('.NS', '')}
            </button>
          ))}
        </div>
        <button onClick={run} disabled={loading} className="btn-primary ml-auto">
          <Play size={16} />
          {loading ? 'Running...' : 'Run Backtest'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {loading ? (
        <LoadingSpinner text="Running walk-forward backtest (this may take ~30s)..." />
      ) : result ? (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <MetricBox label="Accuracy" value={`${(result.accuracy * 100).toFixed(1)}%`} sub="Overall" />
            <MetricBox label="Win Rate" value={`${(result.win_rate * 100).toFixed(1)}%`} sub="Profitable trades" />
            <MetricBox label="Total Trades" value={result.total_trades.toString()} sub="Simulated" />
            <MetricBox
              label="Final Equity"
              value={`₹${result.final_equity.toLocaleString()}`}
              sub="Started ₹10,000"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <EquityChart data={result.equity_curve} />
            <ConfusionMatrix matrix={result.confusion_matrix} labels={result.label_names} />
          </div>

          <div className="mt-6 glass-card p-5">
            <p className="text-white font-semibold mb-2">Methodology</p>
            <p className="text-slate-400 text-sm leading-relaxed">
              Walk-forward backtesting with 5-fold TimeSeriesSplit. Each fold trains on past data and tests on
              future data to prevent look-ahead bias. Signals: BUY if 5-day forward return &gt; 1%,
              SELL if &lt; -1%, HOLD otherwise. P&L simulated with 1-day execution lag.
            </p>
          </div>
        </>
      ) : (
        <div className="glass-card p-16 text-center">
          <FlaskConical size={40} className="text-blue-400 mx-auto mb-4 opacity-50" />
          <p className="text-slate-400 text-lg font-medium">Select a stock and run backtest</p>
          <p className="text-slate-500 text-sm mt-2">Uses 2 years of historical data</p>
        </div>
      )}
    </div>
  )
}
