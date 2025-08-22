from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import pandas as pd
from prophet import Prophet
from datetime import date

API_KEY = None  # mettre une clé si tu veux sécuriser (et vérifier avec le header X-API-Key)
app = FastAPI(title="EPI Forecast Service", version="1.0.0")

class Point(BaseModel):
    ds: date          # 1er jour du mois (YYYY-MM-01)
    y: int = Field(ge=0)

class Serie(BaseModel):
    materiel_id: int
    taille_id: Optional[int] = None
    points: List[Point]      # série mensuelle complète (mois manquants = 0)

class ForecastRequest(BaseModel):
    series: List[Serie]
    horizon_months: int = Field(default=6, ge=1, le=24)

@app.get("/health")
def health():
    return {"status": "ok"}

def clamp(x: float) -> int:
    return max(int(round(x)), 0)

def run_prophet(df: pd.DataFrame, horizon: int) -> pd.DataFrame:
    m = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False)
    m.fit(df)
    future = m.make_future_dataframe(periods=horizon, freq='MS')
    fcst = m.predict(future).tail(horizon)
    return fcst[["ds", "yhat", "yhat_lower", "yhat_upper"]]

def moving_avg(df: pd.DataFrame, horizon: int):
    vals = df["y"].tolist()
    nz = [v for v in vals if v > 0]
    base = sum(nz[-6:]) / min(6, len(nz[-6:])) if nz else (sum(vals[-6:]) / min(6, len(vals)) if len(vals) else 0)
    last_ds = pd.to_datetime(df["ds"].max()).date()
    rows = []
    for i in range(1, horizon + 1):
        next_ds = (pd.to_datetime(last_ds) + pd.offsets.MonthBegin(i)).date()
        p = clamp(base)
        rows.append((next_ds, p, max(p-2,0), p+2))
    return rows

@app.post("/forecast")
def forecast(req: ForecastRequest, x_api_key: Optional[str] = Header(default=None)):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

    out = []
    for s in req.series:
        df = pd.DataFrame([{"ds": p.ds, "y": p.y} for p in s.points])
        df["ds"] = pd.to_datetime(df["ds"])
        df["y"] = pd.to_numeric(df["y"], errors="coerce").fillna(0.0)

        try:
            if df["y"].sum() <= 0 or df["ds"].nunique() < 6:
                raise RuntimeError("short/flat series")
            fcst = run_prophet(df, req.horizon_months)
            for _, r in fcst.iterrows():
                out.append({
                    "materiel_id": s.materiel_id,
                    "taille_id": s.taille_id,
                    "periode": pd.to_datetime(r["ds"]).date().isoformat(),
                    "qte_prevue": clamp(r["yhat"]),
                    "qte_inf": clamp(r["yhat_lower"]),
                    "qte_sup": clamp(r["yhat_upper"]),
                    "modele": "prophet"
                })
        except Exception:
            for next_ds, p, lo, hi in moving_avg(df, req.horizon_months):
                out.append({
                    "materiel_id": s.materiel_id,
                    "taille_id": s.taille_id,
                    "periode": next_ds.isoformat(),
                    "qte_prevue": p,
                    "qte_inf": lo,
                    "qte_sup": hi,
                    "modele": "moving_avg"
                })

    return {"forecasts": out}
