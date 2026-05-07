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
