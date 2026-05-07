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
