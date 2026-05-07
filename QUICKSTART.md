# 🚀 Quick Start Guide

Get the AI Stock Signal Predictor running in 5 minutes!

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/aravindan240009-design/machine-learning-mini-project.git
cd machine-learning-mini-project
```

---

## Step 2: Backend Setup (Terminal 1)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies (takes ~2 minutes)
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --reload --port 8000
```

✅ Backend running at: **http://localhost:8000**

---

## Step 3: Frontend Setup (Terminal 2)

```bash
# Navigate to frontend (open new terminal)
cd frontend

# Install dependencies (takes ~1 minute)
npm install

# Start the dev server
npm run dev
```

✅ Frontend running at: **http://localhost:5173**

---

## Step 4: Open the Dashboard

Open your browser and go to:
```
http://localhost:5173
```

---

## 🎯 First Steps in the App

### 1. View Stock Prices
- Dashboard loads automatically
- Click **"Generate Signals"** to run AI analysis

### 2. Explore Watchlist
- Click **"Watchlist"** in sidebar
- Select any stock to see charts and indicators

### 3. Generate AI Signals
- Click **"AI Signals"** in sidebar
- Click **"Run AI Analysis"**
- Wait ~20 seconds for all 5 stocks
- View BUY/SELL/HOLD predictions with confidence %

### 4. Train Models
- Click **"Model Performance"** in sidebar
- Click **"Train [STOCK]"** for any stock
- View accuracy, precision, recall, F1 score

### 5. Run Backtest
- Click **"Backtesting"** in sidebar
- Select a stock
- Click **"Run Backtest"**
- View equity curve and confusion matrix

---

## 🔧 Troubleshooting

### Backend won't start
```bash
# Make sure you're in the backend folder
cd backend

# Check Python version (need 3.11+)
python --version

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Frontend won't start
```bash
# Make sure you're in the frontend folder
cd frontend

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port already in use
```bash
# Backend: Change port in command
uvicorn main:app --reload --port 8001

# Frontend: Change port in vite.config.ts
# Then restart: npm run dev
```

### No stock data showing
- The app uses synthetic data as fallback if yfinance is blocked
- Data is cached in SQLite after first fetch
- Try clicking "Generate Signals" to populate the database

---

## 📊 API Testing (Optional)

Test the backend directly:

```bash
# Get all stocks
curl http://localhost:8000/api/stocks

# Get stock data with indicators
curl http://localhost:8000/api/stocks/RELIANCE.NS/data

# Train a model
curl -X POST http://localhost:8000/api/train-model \
  -H "Content-Type: application/json" \
  -d '{"symbol":"RELIANCE.NS"}'

# Generate signals
curl http://localhost:8000/api/signals

# Get performance metrics
curl http://localhost:8000/api/performance

# Run backtest
curl -X POST http://localhost:8000/api/backtest \
  -H "Content-Type: application/json" \
  -d '{"symbol":"TCS.NS"}'
```

Or visit the interactive API docs:
```
http://localhost:8000/docs
```

---

## 🎓 For Presentation/Demo

### Recommended Flow:
1. **Start with Dashboard** - Show overview and stock prices
2. **Go to Watchlist** - Demonstrate technical indicators and charts
3. **Generate AI Signals** - Show the ML predictions in action
4. **Model Performance** - Explain the ensemble approach and metrics
5. **Backtesting** - Show validation methodology and results

### Key Points to Highlight:
- ✅ Full-stack architecture (React + FastAPI)
- ✅ Ensemble ML (XGBoost + RF + LR)
- ✅ 10 technical indicators
- ✅ Real-time predictions with confidence
- ✅ Walk-forward backtesting
- ✅ Professional fintech UI
- ✅ RESTful API design
- ✅ Database persistence

---

## 📱 Screenshots Locations

Take screenshots of:
1. Dashboard with signals
2. Watchlist with charts
3. AI Signals page (BUY/SELL/HOLD cards)
4. Model Performance radar charts
5. Backtesting equity curve

Save them in a `screenshots/` folder for your report!

---

## 🛑 Stopping the Servers

### Backend
Press `Ctrl+C` in the backend terminal

### Frontend
Press `Ctrl+C` in the frontend terminal

---

## 📚 Next Steps

- Read `README.md` for detailed setup
- Check `PROJECT_OVERVIEW.md` for architecture details
- Explore the code in `backend/` and `frontend/src/`
- Customize stocks in `backend/utils/data_fetcher.py`
- Modify UI colors in `frontend/tailwind.config.js`

---

## 💡 Tips

- Keep both terminals open while using the app
- Backend must be running for frontend to work
- First signal generation takes longer (training models)
- Subsequent requests are faster (models cached in memory)
- SQLite database is created automatically on first run

---

**Happy Trading! 📈**

*Remember: This is for educational purposes only. Not financial advice.*
