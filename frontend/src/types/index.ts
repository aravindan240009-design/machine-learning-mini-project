export interface StockInfo {
  symbol: string
  name: string
  price: number | null
  change: number
  volume: number
  date: string
}

export interface StockDataPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  rsi: number
  macd: number
  macd_signal: number
  macd_hist: number
  sma_20: number
  ema_50: number
  bb_upper: number
  bb_lower: number
  bb_mid: number
  atr: number
}

export interface Signal {
  symbol: string
  name: string
  signal: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  entry_price: number
  stop_loss: number
  target_price: number
  predicted_move: number
  timestamp: string
  probabilities: { BUY: number; SELL: number; HOLD: number }
  error?: string
}

export interface ModelMetric {
  symbol: string
  accuracy: number
  precision: number
  recall: number
  f1_score: number
  win_rate: number
  total_trades: number
  trained_at: string
}

export interface BacktestResult {
  symbol: string
  accuracy: number
  win_rate: number
  total_trades: number
  final_equity: number
  confusion_matrix: number[][]
  equity_curve: { index: number; equity: number }[]
  label_names: string[]
}
