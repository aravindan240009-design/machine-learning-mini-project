import axios from 'axios'
import type { StockInfo, StockDataPoint, Signal, ModelMetric, BacktestResult } from '../types'

const api = axios.create({ baseURL: '/api' })

export const getStocks = (): Promise<StockInfo[]> =>
  api.get('/stocks').then(r => r.data)

export const getStockData = (symbol: string): Promise<{ symbol: string; data: StockDataPoint[] }> =>
  api.get(`/stocks/${symbol}/data`).then(r => r.data)

export const trainModel = (symbol: string): Promise<{ symbol: string; status: string; metrics: ModelMetric }> =>
  api.post('/train-model', { symbol }).then(r => r.data)

export const getSignals = (): Promise<Signal[]> =>
  api.get('/signals').then(r => r.data)

export const getPerformance = (): Promise<ModelMetric[]> =>
  api.get('/performance').then(r => r.data)

export const runBacktest = (symbol: string): Promise<BacktestResult> =>
  api.post('/backtest', { symbol }).then(r => r.data)
