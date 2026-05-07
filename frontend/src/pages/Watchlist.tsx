import { useEffect, useState } from 'react'
import { getStockData } from '../services/api'
import type { StockDataPoint } from '../types'
import PriceChart from '../charts/PriceChart'
import IndicatorChart from '../charts/IndicatorChart'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'

const STOCKS = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS']

export default function Watchlist() {
  const [selected, setSelected] = useState(STOCKS[0])
  const [data, setData] = useState<StockDataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    getStockData(selected)
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load data. Check backend.'))
      .finally(() => setLoading(false))
  }, [selected])

  const latest = data[data.length - 1]

  return (
    <div className="animate-fade-in">
      <PageHeader title="Watchlist" subtitle="OHLCV data with technical indicators" />

      {/* Stock selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STOCKS.map(s => (
          <button
            key={s}
            onClick={() => setSelected(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              selected === s
                ? 'bg-blue-600 text-white'
                : 'glass-card text-slate-400 hover:text-white'
            }`}
          >
            {s.replace('.NS', '')}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {loading ? <LoadingSpinner text="Fetching stock data..." /> : (
        <>
          {/* OHLCV summary */}
          {latest && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
              {[
                { label: 'Open', value: `₹${latest.open?.toFixed(2)}` },
                { label: 'High', value: `₹${latest.high?.toFixed(2)}`, cls: 'text-emerald-400' },
                { label: 'Low', value: `₹${latest.low?.toFixed(2)}`, cls: 'text-red-400' },
                { label: 'Close', value: `₹${latest.close?.toFixed(2)}`, cls: 'text-blue-400' },
                { label: 'RSI', value: latest.rsi?.toFixed(1), cls: latest.rsi > 70 ? 'text-red-400' : latest.rsi < 30 ? 'text-emerald-400' : 'text-amber-400' },
                { label: 'ATR', value: latest.atr?.toFixed(2) },
              ].map(({ label, value, cls }) => (
                <div key={label} className="glass-card p-3 text-center">
                  <p className="text-slate-500 text-xs mb-1">{label}</p>
                  <p className={`font-bold font-mono text-sm ${cls ?? 'text-white'}`}>{value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              {data.length > 0 && <PriceChart data={data} />}
            </div>
            <div>
              {data.length > 0 && <IndicatorChart data={data} />}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
