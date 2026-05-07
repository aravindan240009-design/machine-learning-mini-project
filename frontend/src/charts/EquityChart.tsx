import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface Props {
  data: { index: number; equity: number }[]
  initialEquity?: number
}

export default function EquityChart({ data, initialEquity = 10000 }: Props) {
  const final = data[data.length - 1]?.equity ?? initialEquity
  const pnl = ((final - initialEquity) / initialEquity * 100).toFixed(2)
  const isProfit = final >= initialEquity

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-white font-semibold">Equity Curve</p>
        <div className="text-right">
          <p className="text-slate-400 text-xs">Final Equity</p>
          <p className={`font-bold text-lg ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
            ₹{final.toLocaleString()}
          </p>
          <p className={`text-xs ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}{pnl}%
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isProfit ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isProfit ? '#10b981' : '#ef4444'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
          <XAxis dataKey="index" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} width={65}
            tickFormatter={v => `₹${v.toLocaleString()}`} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ background: '#0f1629', border: '1px solid #1e2d4d', borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => [`₹${v.toFixed(2)}`, 'Equity']}
          />
          <Area type="monotone" dataKey="equity" stroke={isProfit ? '#10b981' : '#ef4444'}
            strokeWidth={2} fill="url(#equityGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
