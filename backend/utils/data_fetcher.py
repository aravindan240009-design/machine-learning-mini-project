"""
Fetch stock data via yfinance with a realistic synthetic fallback.
Indicators computed with the `ta` library.
"""
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
