import { useEffect, useState } from 'react'
import { BarChart3, RefreshCw, Brain } from 'lucide-react'
import { getPerformance, trainModel } from '../services/api'
import type { ModelMetric } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip
} from 'recharts'

const STOCKS = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS']

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-semibold">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value * 100}%`, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

export default function ModelPerformance() {
  const [metrics, setMetrics] = useState<ModelMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [training, setTraining] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    getPerformance()
      .then(setMetrics)
      .catch(() => setError('Failed to load metrics'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleTrain = async (symbol: string) => {
    setTraining(symbol)
    try {
      await trainModel(symbol)
      await load()
    } catch {
      setError(`Training failed for ${symbol}`)
    } finally {
      setTraining(null)
    }
  }

  if (loading) return <LoadingSpinner text="Loading model metrics..." />

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Model Performance"
        subtitle="Ensemble model accuracy metrics per stock"
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {/* Train all */}
      <div className="glass-card p-5 mb-8">
        <p className="text-white font-semibold mb-3">Train Models</p>
        <p className="text-slate-400 text-sm mb-4">
          Train the XGBoost + RandomForest + LogisticRegression ensemble on 2 years of data.
        </p>
        <div className="flex flex-wrap gap-3">
          {STOCKS.map(sym => (
            <button
              key={sym}
              onClick={() => handleTrain(sym)}
              disabled={!!training}
              className="btn-primary text-sm"
            >
              {training === sym ? (
                <><RefreshCw size={14} className="animate-spin" /> Training...</>
              ) : (
                <><Brain size={14} /> Train {sym.replace('.NS', '')}</>
              )}
            </button>
          ))}
        </div>
      </div>

      {metrics.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Brain size={40} className="text-blue-400 mx-auto mb-4 opacity-50" />
          <p className="text-slate-400">No metrics yet. Train a model first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {metrics.map(m => {
            const radarData = [
              { metric: 'Accuracy', value: m.accuracy * 100 },
              { metric: 'Precision', value: m.precision * 100 },
              { metric: 'Recall', value: m.recall * 100 },
              { metric: 'F1 Score', value: m.f1_score * 100 },
              { metric: 'Win Rate', value: m.win_rate * 100 },
            ]
            return (
              <div key={m.symbol} className="glass-card p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-white font-bold text-lg">{m.symbol.replace('.NS', '')}</p>
                    <p className="text-slate-500 text-xs">{m.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs">Trades</p>
                    <p className="text-white font-bold">{m.total_trades}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <MetricBar label="Accuracy" value={m.accuracy} color="bg-blue-500" />
                    <MetricBar label="Precision" value={m.precision} color="bg-purple-500" />
                    <MetricBar label="Recall" value={m.recall} color="bg-emerald-500" />
                    <MetricBar label="F1 Score" value={m.f1_score} color="bg-amber-500" />
                    <MetricBar label="Win Rate" value={m.win_rate} color="bg-pink-500" />
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#1e2d4d" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 9 }} />
                      <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                      <Tooltip
                        contentStyle={{ background: '#0f1629', border: '1px solid #1e2d4d', borderRadius: 8, fontSize: 11 }}
                        formatter={(v: number) => [`${v.toFixed(1)}%`]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {m.trained_at && (
                  <p className="text-slate-600 text-xs mt-3">
                    Trained: {new Date(m.trained_at).toLocaleString()}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
