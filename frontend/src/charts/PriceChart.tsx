import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts'
import type { StockDataPoint } from '../types'

interface Props { data: StockDataPoint[] }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 text-xs space-y-1 min-w-[160px]">
      <p className="text-slate-400 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-white font-mono">
            {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function PriceChart({ data }: Props) {
  const sliced = data.slice(-60)
  return (
    <div className="glass-card p-5">
      <p className="text-white font-semibold mb-4">Price + Bollinger Bands</p>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={sliced}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false}
            tickFormatter={v => v.slice(5)} interval={9} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} width={65}
            tickFormatter={v => `₹${v.toLocaleString()}`} domain={['auto', 'auto']} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
          <Line type="monotone" dataKey="bb_upper" stroke="#3b82f6" strokeWidth={1}
            dot={false} strokeDasharray="4 2" name="BB Upper" />
          <Line type="monotone" dataKey="bb_lower" stroke="#3b82f6" strokeWidth={1}
            dot={false} strokeDasharray="4 2" name="BB Lower" />
          <Line type="monotone" dataKey="sma_20" stroke="#f59e0b" strokeWidth={1.5}
            dot={false} name="SMA 20" />
          <Line type="monotone" dataKey="ema_50" stroke="#8b5cf6" strokeWidth={1.5}
            dot={false} name="EMA 50" />
          <Line type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2}
            dot={false} name="Close" />
          <Bar dataKey="volume" fill="#1e2d4d" opacity={0.5} name="Volume" yAxisId={1} />
          <YAxis yAxisId={1} orientation="right" hide />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
