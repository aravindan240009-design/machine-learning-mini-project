# AI Stock Signal Predictor

A college mini project — a production-style AI-powered stock market prediction dashboard for NSE stocks.

## Tech Stack

| Layer      | Tech                                      |
|------------|-------------------------------------------|
| Frontend   | React + TypeScript, Tailwind CSS, Recharts |
| Backend    | Python FastAPI                            |
| Database   | SQLite (via SQLAlchemy)                   |
| ML         | XGBoost, RandomForest, LogisticRegression (VotingClassifier ensemble) |
| Data       | yfinance (free NSE data)                  |

## Project Structure

```
ai-stock-predictor/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env
│   ├── api/routes.py        # All API endpoints
│   ├── database/db.py       # SQLite models + session
│   ├── ml/
│   │   ├── predictor.py     # Ensemble ML pipeline
│   │   └── backtester.py    # Walk-forward backtesting
│   └── utils/data_fetcher.py # yfinance + indicators
└── frontend/
    ├── src/
    │   ├── pages/           # Dashboard, Watchlist, AISignals, etc.
    │   ├── components/      # Sidebar, SignalCard, StatCard, etc.
    │   ├── charts/          # PriceChart, IndicatorChart, EquityChart
    │   ├── services/api.ts  # Axios API calls
    │   └── types/index.ts   # TypeScript interfaces
    └── package.json
```

## Setup & Installation

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000  
API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

## API Endpoints

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | /api/stocks           | List all stocks with latest price  |
| GET    | /api/stocks/{symbol}/data | OHLCV + indicators             |
| POST   | /api/train-model      | Train ensemble for a symbol        |
| GET    | /api/signals          | Generate signals for all stocks    |
| GET    | /api/performance      | Model metrics from DB              |
| POST   | /api/backtest         | Run walk-forward backtest          |

## Features

- **AI Signals** — BUY / SELL / HOLD with confidence % using ensemble voting
- **Technical Indicators** — RSI, MACD, SMA 20, EMA 50, Bollinger Bands, ATR
- **Backtesting** — Walk-forward with equity curve and confusion matrix
- **Model Performance** — Accuracy, Precision, Recall, F1, Win Rate per stock
- **Dark Mode UI** — Glassmorphism, gradient cards, animated stats

## Supported Stocks

- RELIANCE.NS
- TCS.NS
- INFY.NS
- HDFCBANK.NS
- ICICIBANK.NS

## ML Pipeline

1. Fetch 2 years of OHLCV data via yfinance
2. Compute 10 technical indicators with pandas-ta
3. Label: BUY (5-day return > 1%), SELL (< -1%), HOLD otherwise
4. Train XGBoost + RandomForest + LogisticRegression
5. Combine with VotingClassifier (soft voting)
6. Predict signal + confidence for latest data point
7. Risk management: Stop loss = 1.5x ATR, Target = 2x ATR

## Disclaimer

This is a college mini project for educational purposes only. Not financial advice.
