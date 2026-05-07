# AI Stock Signal Predictor - Project Overview

## 🎓 College Mini Project
**A production-grade AI-powered stock market prediction dashboard for NSE stocks**

---

## 📊 Project Summary

This is a full-stack machine learning application that predicts BUY/SELL/HOLD signals for Indian NSE stocks using ensemble learning. The project demonstrates:

- Real-time stock data processing
- Advanced ML ensemble techniques
- Professional fintech UI/UX
- RESTful API architecture
- Database persistence
- Backtesting capabilities

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  (TypeScript + Tailwind + Recharts + React Router)      │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   FastAPI Backend                        │
│              (Python + SQLAlchemy)                       │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   ML Engine  │  │ Data Fetcher │  │   Database   │  │
│  │  (Ensemble)  │  │  (yfinance)  │  │   (SQLite)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🤖 Machine Learning Pipeline

### Models Used
1. **XGBoost** - Gradient boosting for complex patterns
2. **Random Forest** - Ensemble of decision trees
3. **Logistic Regression** - Linear baseline model

### Ensemble Strategy
- **VotingClassifier** with soft voting
- Combines probability predictions from all 3 models
- Outputs final signal with confidence percentage

### Features (10 Technical Indicators)
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- MACD Signal Line
- MACD Histogram
- SMA 20 (Simple Moving Average)
- EMA 50 (Exponential Moving Average)
- Bollinger Bands (Upper, Lower, Middle)
- ATR (Average True Range)
- Close Price
- Volume

### Target Labels
```python
BUY:  5-day forward return > +1%
SELL: 5-day forward return < -1%
HOLD: 5-day forward return between -1% and +1%
```

### Risk Management
- **Stop Loss**: Entry Price - (1.5 × ATR)
- **Target Price**: Entry Price + (2.0 × ATR)
- Risk-reward ratio: ~1:1.33

---

## 📁 Project Structure

```
ai-stock-predictor/
│
├── backend/
│   ├── main.py                    # FastAPI app entry
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # Environment config
│   │
│   ├── api/
│   │   └── routes.py              # All 6 REST endpoints
│   │
│   ├── database/
│   │   └── db.py                  # SQLAlchemy models + session
│   │
│   ├── ml/
│   │   ├── predictor.py           # Ensemble training + prediction
│   │   └── backtester.py          # Walk-forward backtesting
│   │
│   └── utils/
│       └── data_fetcher.py        # yfinance + indicators
│
└── frontend/
    ├── package.json               # Node dependencies
    ├── vite.config.ts             # Vite bundler config
    ├── tailwind.config.js         # Tailwind CSS config
    │
    └── src/
        ├── main.tsx               # React entry point
        ├── App.tsx                # Router setup
        ├── index.css              # Global styles
        │
        ├── pages/                 # 5 main pages
        │   ├── Dashboard.tsx
        │   ├── Watchlist.tsx
        │   ├── AISignals.tsx
        │   ├── ModelPerformance.tsx
        │   └── Backtesting.tsx
        │
        ├── components/            # Reusable UI components
        │   ├── Sidebar.tsx
        │   ├── SignalCard.tsx
        │   ├── StatCard.tsx
        │   ├── LoadingSpinner.tsx
        │   └── PageHeader.tsx
        │
        ├── charts/                # Recharts visualizations
        │   ├── PriceChart.tsx
        │   ├── IndicatorChart.tsx
        │   ├── EquityChart.tsx
        │   └── ConfusionMatrix.tsx
        │
        ├── services/
        │   └── api.ts             # Axios API client
        │
        └── types/
            └── index.ts           # TypeScript interfaces
```

---

## 🗄️ Database Schema

### Tables

**1. stocks**
- Stores OHLCV historical data
- Columns: id, symbol, date, open, high, low, close, volume, fetched_at

**2. predictions**
- Stores individual predictions
- Columns: id, symbol, signal, confidence, entry_price, stop_loss, target_price, predicted_move, created_at

**3. signals**
- Stores generated trading signals
- Columns: id, symbol, signal, confidence, entry_price, stop_loss, target_price, predicted_move, timestamp

**4. model_metrics**
- Stores model performance metrics
- Columns: id, symbol, accuracy, precision, recall, f1_score, win_rate, total_trades, trained_at

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stocks` | List all stocks with latest prices |
| GET | `/api/stocks/{symbol}/data` | OHLCV + indicators for a symbol |
| POST | `/api/train-model` | Train ensemble model for a symbol |
| GET | `/api/signals` | Generate signals for all stocks |
| GET | `/api/performance` | Retrieve model metrics from DB |
| POST | `/api/backtest` | Run walk-forward backtest |

---

## 🎨 UI Features

### Design System
- **Dark Mode**: Professional trading terminal aesthetic
- **Glassmorphism**: Frosted glass effect cards
- **Gradient Accents**: Blue/purple gradients
- **Animations**: Fade-in, slide-up, pulse effects
- **Responsive**: Mobile-first design

### Color Palette
```css
Background: #0a0e1a (dark-900)
Cards: #0f1629 (dark-800) with backdrop blur
Accent Blue: #3b82f6
Accent Green: #10b981 (BUY signals)
Accent Red: #ef4444 (SELL signals)
Accent Yellow: #f59e0b (HOLD signals)
```

### Pages

**1. Dashboard**
- Market overview
- Stock price table
- Quick signal generation
- Summary statistics

**2. Watchlist**
- Stock selector
- Price + Bollinger Bands chart
- RSI + MACD indicator charts
- OHLCV summary cards

**3. AI Signals**
- Signal generation button
- Grouped signal cards (BUY/HOLD/SELL)
- Confidence meters
- Probability distributions
- Entry/Stop/Target prices

**4. Model Performance**
- Train models per stock
- Accuracy/Precision/Recall/F1 metrics
- Radar charts
- Training history

**5. Backtesting**
- Stock selector
- Run backtest button
- Equity curve chart
- Confusion matrix
- Performance metrics

---

## 📈 Supported Stocks

| Symbol | Company |
|--------|---------|
| RELIANCE.NS | Reliance Industries |
| TCS.NS | Tata Consultancy Services |
| INFY.NS | Infosys |
| HDFCBANK.NS | HDFC Bank |
| ICICIBANK.NS | ICICI Bank |

---

## 🚀 Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📊 Model Performance Metrics

### Typical Results
- **Accuracy**: 40-60% (3-class classification)
- **Precision**: 50-70%
- **Recall**: 40-60%
- **F1 Score**: 35-55%
- **Win Rate**: 40-50%

*Note: Stock prediction is inherently difficult. These metrics are realistic for a student project and demonstrate proper ML evaluation.*

---

## 🧪 Backtesting Methodology

### Walk-Forward Validation
1. Split data into 5 time-based folds (TimeSeriesSplit)
2. For each fold:
   - Train on past data
   - Test on future data
3. Simulate trades with 1-day execution lag
4. Calculate P&L and equity curve
5. Aggregate metrics across all folds

### Metrics Tracked
- Overall accuracy
- Win rate (profitable trades %)
- Total trades executed
- Final equity (starting: ₹10,000)
- Confusion matrix

---

## 🔒 Security & Best Practices

- Environment variables for sensitive config
- CORS configured for local development
- SQL injection prevention via SQLAlchemy ORM
- Input validation with Pydantic
- Error handling throughout
- Loading states for async operations

---

## 📚 Technologies Used

### Backend
- **FastAPI** - Modern async web framework
- **SQLAlchemy** - ORM for database
- **Scikit-learn** - ML algorithms
- **XGBoost** - Gradient boosting
- **ta** - Technical analysis indicators
- **yfinance** - Stock data API
- **Pandas** - Data manipulation
- **NumPy** - Numerical computing

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Utility-first CSS
- **Recharts** - Chart library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Lucide React** - Icon library

---

## 🎯 Learning Outcomes

This project demonstrates:
1. Full-stack development skills
2. Machine learning pipeline implementation
3. RESTful API design
4. Database modeling
5. Modern frontend architecture
6. Data visualization
7. Financial domain knowledge
8. Software engineering best practices

---

## ⚠️ Disclaimer

**This is an educational project for college coursework.**

- Not intended for real trading
- No guarantee of prediction accuracy
- Stock markets are inherently unpredictable
- Always consult financial advisors for investment decisions

---

## 📝 License

MIT License - Free for educational use

---

## 👨‍💻 Author

**College Mini Project**  
AI Stock Signal Predictor  
NSE Market Prediction Dashboard

---

## 🙏 Acknowledgments

- yfinance for free stock data API
- Scikit-learn for ML algorithms
- FastAPI for excellent documentation
- React community for UI patterns
- TradingView for design inspiration

---

**Built with ❤️ for learning and demonstration purposes**
