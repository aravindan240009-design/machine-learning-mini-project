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
