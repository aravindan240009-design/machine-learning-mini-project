import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Watchlist from './pages/Watchlist'
import AISignals from './pages/AISignals'
import ModelPerformance from './pages/ModelPerformance'
import Backtesting from './pages/Backtesting'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-dark-900">
        <Sidebar />
        <main className="flex-1 ml-64 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/signals" element={<AISignals />} />
            <Route path="/performance" element={<ModelPerformance />} />
            <Route path="/backtest" element={<Backtesting />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
