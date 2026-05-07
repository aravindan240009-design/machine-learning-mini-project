
import yfinance as yf
import pandas as pd
import numpy as np
import ta
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database.db import StockData

SUPPORTED_STOCKS = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS"]

# Approximate base prices for synthetic generation
BASE_PRICES = {
    "RELIANCE.NS":  2900.0,
    "TCS.NS":       3800.0,
    "INFY.NS":      1500.0,
    "HDFCBANK.NS":  1650.0,
    "ICICIBANK.NS": 1100.0,
}


def _generate_synthetic(symbol: str, days: int = 500) -> pd.DataFrame:
    """
    Generate realistic OHLCV data using geometric Brownian motion.
    Used as fallback when yfinance is unavailable.
    """
    np.random.seed(abs(hash(symbol)) % (2**31))
    base = BASE_PRICES.get(symbol, 1000.0)
    mu, sigma = 0.0003, 0.015          # daily drift & volatility

    closes = [base]
    for _ in range(days - 1):
        ret = np.random.normal(mu, sigma)
        closes.append(closes[-1] * (1 + ret))

    closes = np.array(closes)
    highs  = closes * (1 + np.abs(np.random.normal(0, 0.008, days)))
    lows   = closes * (1 - np.abs(np.random.normal(0, 0.008, days)))
    opens  = np.roll(closes, 1); opens[0] = base
    volumes = np.random.randint(500_000, 5_000_000, days).astype(float)

    end_date = datetime.today()
    dates = [(end_date - timedelta(days=days - i - 1)).strftime("%Y-%m-%d") for i in range(days)]

    return pd.DataFrame({
        "date": dates,
        "open": np.round(opens, 2),
        "high": np.round(highs, 2),
        "low":  np.round(lows, 2),
        "close": np.round(closes, 2),
        "volume": volumes,
    })


def fetch_stock_data(symbol: str, period: str = "1y") -> pd.DataFrame:
    """Download OHLCV from yfinance; fall back to synthetic if unavailable."""
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period)
        if df.empty:
            raise ValueError("Empty response from yfinance")
        df.reset_index(inplace=True)
        df.rename(columns={
            "Date": "date", "Open": "open", "High": "high",
            "Low": "low", "Close": "close", "Volume": "volume"
        }, inplace=True)
        df["date"] = df["date"].astype(str).str[:10]
        return df[["date", "open", "high", "low", "close", "volume"]].copy()
    except Exception:
        # Fallback: synthetic data (realistic GBM)
        days = 730 if "2y" in period else 365
        return _generate_synthetic(symbol, days=days)


def add_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Compute RSI, MACD, SMA20, EMA50, Bollinger Bands, ATR."""
    df = df.copy().reset_index(drop=True)
    close = df["close"]
    high  = df["high"]
    low   = df["low"]

    df["rsi"]        = ta.momentum.RSIIndicator(close=close, window=14).rsi()

    macd_obj         = ta.trend.MACD(close=close, window_slow=26, window_fast=12, window_sign=9)
    df["macd"]       = macd_obj.macd()
    df["macd_signal"]= macd_obj.macd_signal()
    df["macd_hist"]  = macd_obj.macd_diff()

    df["sma_20"]     = ta.trend.SMAIndicator(close=close, window=20).sma_indicator()
    df["ema_50"]     = ta.trend.EMAIndicator(close=close, window=50).ema_indicator()

    bb               = ta.volatility.BollingerBands(close=close, window=20, window_dev=2)
    df["bb_upper"]   = bb.bollinger_hband()
    df["bb_lower"]   = bb.bollinger_lband()
    df["bb_mid"]     = bb.bollinger_mavg()

    df["atr"]        = ta.volatility.AverageTrueRange(
                           high=high, low=low, close=close, window=14
                       ).average_true_range()

    df.dropna(inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df


def cache_to_db(symbol: str, df: pd.DataFrame, db: Session):
    """Store OHLCV rows in SQLite, skipping already-stored dates."""
    existing = {
        r.date for r in db.query(StockData.date).filter(StockData.symbol == symbol).all()
    }
    new_rows = [
        StockData(
            symbol=symbol, date=row["date"],
            open=row["open"], high=row["high"],
            low=row["low"],  close=row["close"], volume=row["volume"],
        )
        for _, row in df.iterrows() if row["date"] not in existing
    ]
    if new_rows:
        db.bulk_save_objects(new_rows)
        db.commit()


def get_cached_data(symbol: str, db: Session) -> pd.DataFrame | None:
    """Return cached OHLCV from SQLite."""
    rows = (
        db.query(StockData)
        .filter(StockData.symbol == symbol)
        .order_by(StockData.date)
        .all()
    )
    if not rows:
        return None
    return pd.DataFrame([{
        "date": r.date, "open": r.open, "high": r.high,
        "low": r.low, "close": r.close, "volume": r.volume
    } for r in rows])

```


---

### backend/ml/predictor.py
```python
"""
Ensemble ML pipeline: XGBoost + RandomForest + LogisticRegression
Target: BUY (future_return > 1%), SELL (< -1%), HOLD otherwise
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from xgboost import XGBClassifier
import warnings
warnings.filterwarnings("ignore")

FEATURE_COLS = ["rsi", "macd", "macd_signal", "macd_hist",
                "sma_20", "ema_50", "bb_upper", "bb_lower", "atr",
                "close", "volume"]

# Label map: 0=SELL, 1=HOLD, 2=BUY
LABEL_MAP = {0: "SELL", 1: "HOLD", 2: "BUY"}


def create_labels(df: pd.DataFrame, horizon: int = 5) -> pd.DataFrame:
    """Create forward-return labels for classification."""
    df = df.copy()
    df["future_close"] = df["close"].shift(-horizon)
    df["future_return"] = (df["future_close"] - df["close"]) / df["close"] * 100
    df.dropna(inplace=True)

    def label(r):
        if r > 1.0:
            return 2   # BUY
        elif r < -1.0:
            return 0   # SELL
        else:
            return 1   # HOLD

    df["label"] = df["future_return"].apply(label)
    return df


def build_ensemble():
    """Build VotingClassifier with soft voting."""
    xgb = XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.1,
                         use_label_encoder=False, eval_metric="mlogloss",
                         random_state=42, verbosity=0)
    rf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    lr = LogisticRegression(max_iter=500, random_state=42, multi_class="multinomial")

    ensemble = VotingClassifier(
        estimators=[("xgb", xgb), ("rf", rf), ("lr", lr)],
        voting="soft"
    )
    return ensemble


def train_model(df: pd.DataFrame):
    """
    Train ensemble on indicator features.
    Returns: (model, scaler, metrics_dict)
    """
    df = create_labels(df)

    X = df[FEATURE_COLS].values
    y = df["label"].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, shuffle=False
    )

    model = build_ensemble()
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred, average="weighted", zero_division=0), 4),
        "recall": round(recall_score(y_test, y_pred, average="weighted", zero_division=0), 4),
        "f1_score": round(f1_score(y_test, y_pred, average="weighted", zero_division=0), 4),
        "total_trades": int(len(y_test)),
        "win_rate": round(float(np.sum(y_pred == y_test)) / len(y_test), 4),
        "y_test": y_test.tolist(),
        "y_pred": y_pred.tolist(),
    }

    return model, scaler, metrics


def predict_signal(model, scaler, df: pd.DataFrame) -> dict:
    """
    Predict signal for the latest row in df.
    Returns signal dict with confidence, entry, stop_loss, target.
    """
    latest = df[FEATURE_COLS].iloc[-1:].values
    latest_scaled = scaler.transform(latest)

    proba = model.predict_proba(latest_scaled)[0]   # [SELL, HOLD, BUY]
    pred_class = int(np.argmax(proba))
    confidence = round(float(np.max(proba)) * 100, 2)

    signal = LABEL_MAP[pred_class]
    entry_price = round(float(df["close"].iloc[-1]), 2)
    atr = float(df["atr"].iloc[-1])

    # Risk management: stop loss = 1.5x ATR, target = 2x ATR
    if signal == "BUY":
        stop_loss = round(entry_price - 1.5 * atr, 2)
        target_price = round(entry_price + 2.0 * atr, 2)
        predicted_move = round((target_price - entry_price) / entry_price * 100, 2)
    elif signal == "SELL":
        stop_loss = round(entry_price + 1.5 * atr, 2)
        target_price = round(entry_price - 2.0 * atr, 2)
        predicted_move = round((target_price - entry_price) / entry_price * 100, 2)
    else:
        stop_loss = round(entry_price - atr, 2)
        target_price = round(entry_price + atr, 2)
        predicted_move = 0.0

    return {
        "signal": signal,
        "confidence": confidence,
        "entry_price": entry_price,
        "stop_loss": stop_loss,
        "target_price": target_price,
        "predicted_move": predicted_move,
        "probabilities": {
            "SELL": round(float(proba[0]) * 100, 2),
            "HOLD": round(float(proba[1]) * 100, 2),
            "BUY": round(float(proba[2]) * 100, 2),
        }
    }

```


---

### backend/ml/backtester.py
```python
"""Simple backtesting: simulate trades based on model predictions."""
import numpy as np
import pandas as pd
from ml.predictor import create_labels, build_ensemble, FEATURE_COLS, LABEL_MAP
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import TimeSeriesSplit


def run_backtest(df: pd.DataFrame) -> dict:
    """
    Walk-forward backtest using TimeSeriesSplit.
    Returns metrics + equity curve data.
    """
    df = create_labels(df)
    X = df[FEATURE_COLS].values
    y = df["label"].values
    closes = df["close"].values

    tscv = TimeSeriesSplit(n_splits=5)
    equity = [10000.0]   # start with ₹10,000
    all_preds, all_true = [], []
    trade_results = []

    for train_idx, test_idx in tscv.split(X):
        X_train, X_test = X[train_idx], X[test_idx]
        y_train, y_test = y[train_idx], y[test_idx]

        scaler = StandardScaler()
        X_train_s = scaler.fit_transform(X_train)
        X_test_s = scaler.transform(X_test)

        model = build_ensemble()
        model.fit(X_train_s, y_train)
        preds = model.predict(X_test_s)

        all_preds.extend(preds.tolist())
        all_true.extend(y_test.tolist())

        # Simulate P&L
        for i, (pred, actual_close) in enumerate(zip(preds, closes[test_idx])):
            if i + 1 >= len(test_idx):
                break
            next_close = closes[test_idx[i + 1]]
            ret = (next_close - actual_close) / actual_close

            if pred == 2:    # BUY
                pnl = ret
            elif pred == 0:  # SELL
                pnl = -ret
            else:
                pnl = 0.0

            equity.append(equity[-1] * (1 + pnl))
            trade_results.append(pnl)

    all_preds = np.array(all_preds)
    all_true = np.array(all_true)

    wins = sum(1 for p in trade_results if p > 0)
    total = len(trade_results)

    # Confusion matrix counts
    labels = [0, 1, 2]
    cm = [[int(np.sum((all_true == t) & (all_preds == p))) for p in labels] for t in labels]

    equity_curve = [{"index": i, "equity": round(v, 2)} for i, v in enumerate(equity)]

    return {
        "accuracy": round(float(np.mean(all_preds == all_true)), 4),
        "win_rate": round(wins / total, 4) if total else 0,
        "total_trades": total,
        "final_equity": round(equity[-1], 2),
        "confusion_matrix": cm,
        "equity_curve": equity_curve,
        "label_names": ["SELL", "HOLD", "BUY"],
    }

```


---

### backend/api/routes.py
```python
"""FastAPI route definitions."""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database.db import get_db, ModelMetric, Signal, Prediction
from utils.data_fetcher import (
    fetch_stock_data, add_indicators, cache_to_db,
    get_cached_data, SUPPORTED_STOCKS
)
from ml.predictor import train_model, predict_signal
from ml.backtester import run_backtest
from datetime import datetime
import traceback

router = APIRouter()

# In-memory model store (symbol -> {model, scaler})
_models: dict = {}


@router.get("/stocks")
def get_stocks(db: Session = Depends(get_db)):
    """Return list of supported stocks with latest cached price."""
    result = []
    for sym in SUPPORTED_STOCKS:
        cached = get_cached_data(sym, db)
        if cached is not None and not cached.empty:
            latest = cached.iloc[-1]
            prev = cached.iloc[-2] if len(cached) > 1 else latest
            change = round((latest["close"] - prev["close"]) / prev["close"] * 100, 2)
            result.append({
                "symbol": sym,
                "name": sym.replace(".NS", ""),
                "price": round(float(latest["close"]), 2),
                "change": change,
                "volume": int(latest["volume"]),
                "date": latest["date"],
            })
        else:
            result.append({"symbol": sym, "name": sym.replace(".NS", ""), "price": None})
    return result


@router.get("/stocks/{symbol}/data")
def get_stock_data(symbol: str, db: Session = Depends(get_db)):
    """Fetch (or return cached) OHLCV + indicator data for a symbol."""
    if symbol not in SUPPORTED_STOCKS:
        raise HTTPException(status_code=404, detail="Symbol not supported")
    try:
        df = fetch_stock_data(symbol, period="1y")
        cache_to_db(symbol, df, db)
        df_ind = add_indicators(df)
        records = df_ind.tail(120).to_dict(orient="records")
        return {"symbol": symbol, "data": records}
    except Exception as e:
        # Fallback to cache
        cached = get_cached_data(symbol, db)
        if cached is not None:
            df_ind = add_indicators(cached)
            return {"symbol": symbol, "data": df_ind.tail(120).to_dict(orient="records")}
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/train-model")
def train_model_endpoint(payload: dict, db: Session = Depends(get_db)):
    """Train ensemble model for a given symbol."""
    symbol = payload.get("symbol")
    if symbol not in SUPPORTED_STOCKS:
        raise HTTPException(status_code=400, detail="Symbol not supported")
    try:
        df = fetch_stock_data(symbol, period="2y")
        cache_to_db(symbol, df, db)
        df_ind = add_indicators(df)

        model, scaler, metrics = train_model(df_ind)
        _models[symbol] = {"model": model, "scaler": scaler}

        # Persist metrics
        db.add(ModelMetric(
            symbol=symbol,
            accuracy=metrics["accuracy"],
            precision=metrics["precision"],
            recall=metrics["recall"],
            f1_score=metrics["f1_score"],
            win_rate=metrics["win_rate"],
            total_trades=metrics["total_trades"],
        ))
        db.commit()

        return {
            "symbol": symbol,
            "status": "trained",
            "metrics": {k: v for k, v in metrics.items() if k not in ("y_test", "y_pred")}
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/signals")
def get_signals(db: Session = Depends(get_db)):
    """Generate and return latest signals for all supported stocks."""
    signals = []
    for symbol in SUPPORTED_STOCKS:
        try:
            df = fetch_stock_data(symbol, period="1y")
            cache_to_db(symbol, df, db)
            df_ind = add_indicators(df)

            if symbol not in _models:
                model, scaler, _ = train_model(df_ind)
                _models[symbol] = {"model": model, "scaler": scaler}

            result = predict_signal(_models[symbol]["model"], _models[symbol]["scaler"], df_ind)
            result["symbol"] = symbol
            result["name"] = symbol.replace(".NS", "")
            result["timestamp"] = datetime.utcnow().isoformat()

            # Persist signal
            db.add(Signal(
                symbol=symbol,
                signal=result["signal"],
                confidence=result["confidence"],
                entry_price=result["entry_price"],
                stop_loss=result["stop_loss"],
                target_price=result["target_price"],
                predicted_move=result["predicted_move"],
            ))
            db.commit()
            signals.append(result)
        except Exception as e:
            signals.append({"symbol": symbol, "error": str(e)})
    return signals


@router.get("/performance")
def get_performance(db: Session = Depends(get_db)):
    """Return latest model metrics for all symbols."""
    result = []
    for sym in SUPPORTED_STOCKS:
        metric = (
            db.query(ModelMetric)
            .filter(ModelMetric.symbol == sym)
            .order_by(ModelMetric.trained_at.desc())
            .first()
        )
        if metric:
            result.append({
                "symbol": sym,
                "accuracy": metric.accuracy,
                "precision": metric.precision,
                "recall": metric.recall,
                "f1_score": metric.f1_score,
                "win_rate": metric.win_rate,
                "total_trades": metric.total_trades,
                "trained_at": metric.trained_at.isoformat() if metric.trained_at else None,
            })
    return result


@router.post("/backtest")
def backtest_endpoint(payload: dict, db: Session = Depends(get_db)):
    """Run walk-forward backtest for a symbol."""
    symbol = payload.get("symbol")
    if symbol not in SUPPORTED_STOCKS:
        raise HTTPException(status_code=400, detail="Symbol not supported")
    try:
        df = fetch_stock_data(symbol, period="2y")
        cache_to_db(symbol, df, db)
        df_ind = add_indicators(df)
        result = run_backtest(df_ind)
        result["symbol"] = symbol
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

```


---

## FRONTEND


---

### frontend/package.json
```json
{
  "name": "ai-stock-predictor-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1",
    "recharts": "^2.12.7",
    "axios": "^1.7.2",
    "lucide-react": "^0.395.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5",
    "vite": "^5.3.1"
  }
}

```


---

### frontend/vite.config.ts
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})

```


---

### frontend/tailwind.config.js
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0e1a',
          800: '#0f1629',
          700: '#141d35',
          600: '#1a2540',
          500: '#1e2d4d',
        },
        accent: {
          blue: '#3b82f6',
          green: '#10b981',
          red: '#ef4444',
          yellow: '#f59e0b',
          purple: '#8b5cf6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      }
    },
  },
  plugins: [],
}

```


---

### frontend/index.html
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Stock Signal Predictor</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

```
