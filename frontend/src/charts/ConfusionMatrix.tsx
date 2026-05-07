interface Props {
  matrix: number[][]
  labels: string[]
}

const colors = ['bg-red-500/20 text-red-300', 'bg-amber-500/20 text-amber-300', 'bg-emerald-500/20 text-emerald-300']

export default function ConfusionMatrix({ matrix, labels }: Props) {
  const max = Math.max(...matrix.flat())
  return (
    <div className="glass-card p-5">
      <p className="text-white font-semibold mb-4">Confusion Matrix</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-slate-500 p-2 text-left">Actual ↓ / Pred →</th>
              {labels.map((l, i) => (
                <th key={l} className={`p-2 font-semibold ${colors[i]}`}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, ri) => (
              <tr key={ri}>
                <td className={`p-2 font-semibold ${colors[ri]}`}>{labels[ri]}</td>
                {row.map((val, ci) => (
                  <td key={ci} className="p-2 text-center">
                    <div
                      className={`rounded-lg py-2 font-mono font-bold ${
                        ri === ci ? 'bg-blue-500/20 text-blue-300' : 'bg-dark-700/50 text-slate-400'
                      }`}
                      style={{ opacity: max > 0 ? 0.4 + (val / max) * 0.6 : 1 }}
                    >
                      {val}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-slate-500 text-xs mt-3">Diagonal = correct predictions</p>
    </div>
  )
}
