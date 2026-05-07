import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Bar, ComposedChart
} from 'recharts'
import type { StockDataPoint } from '../types'

interface Props { data: StockDataPoint[] }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-2 text-xs">
      <p className="text-slate-400">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function IndicatorChart({ data }: Props) {
  const sliced = data.slice(-60)
  return (
    <div className="space-y-4">
      {/* RSI */}
      <div className="glass-card p-4">
        <p className="text-white text-sm font-semibold mb-3">RSI (14)</p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={sliced}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false}
              tickFormatter={v => v.slice(5)} interval={9} />
            <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} width={30} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
            <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="rsi" stroke="#f59e0b" strokeWidth={2} dot={false} name="RSI" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* MACD */}
      <div className="glass-card p-4">
        <p className="text-white text-sm font-semibold mb-3">MACD</p>
        <ResponsiveContainer width="100%" height={120}>
          <ComposedChart data={sliced}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false}
              tickFormatter={v => v.slice(5)} interval={9} />
            <YAxis tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} width={40} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#475569" />
            <Line type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={2} dot={false} name="MACD" />
            <Line type="monotone" dataKey="macd_signal" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Signal" />
            <Bar dataKey="macd_hist" fill="#8b5cf6" opacity={0.6} name="Histogram" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}


