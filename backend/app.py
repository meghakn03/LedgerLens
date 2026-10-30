"""In-memory API and rules engine for synthetic LedgerLens transactions."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

RULES = [
    {"id": "high-value", "name": "Unusually large purchase", "amount_threshold": 1000, "enabled": True},
    {"id": "velocity", "name": "Transaction velocity", "transaction_threshold": 4, "window_minutes": 10, "enabled": True},
]

app = FastAPI(title="LedgerLens Demo API", version="0.2.0")

today_label = datetime.now().astimezone().strftime("Today, %b %d").replace(" 0", " ")
seeded_transactions = [
    {"id":"TXN-90841","initials":"JM","name":"Jordan Mitchell","card":"•••• 4829","merchant":"NORTHSTAR ELECTRONICS","category":"Electronics","amount":1284.60,"currency":"USD","time":"10:42:18 AM","date":today_label,"location":"Brooklyn, NY","color":"blue"},
    {"id":"TXN-90839","initials":"AC","name":"Avery Chen","card":"•••• 1092","merchant":"CLOUDNINE TRAVEL","category":"Travel","amount":892.40,"currency":"USD","time":"10:38:51 AM","date":today_label,"location":"San Francisco, CA","color":"purple","velocity_count":4,"velocity_window_minutes":8},
    {"id":"TXN-90834","initials":"SK","name":"Sam Kim","card":"•••• 6610","merchant":"MORNING TIDE MARKET","category":"Groceries","amount":64.25,"currency":"USD","time":"10:31:06 AM","date":today_label,"location":"Portland, OR","color":"orange","velocity_count":4,"velocity_window_minutes":9,"_initial_status":"Reviewed","note":"Expected recurring grocery run."},
    {"id":"TXN-90830","initials":"RP","name":"Riley Patel","card":"•••• 3271","merchant":"ATELIER FORM","category":"Shopping","amount":246.00,"currency":"USD","time":"10:27:43 AM","date":today_label,"location":"Austin, TX","color":"green"},
    {"id":"TXN-90827","initials":"TG","name":"Taylor Green","card":"•••• 7743","merchant":"METRO FUEL & GO","category":"Transport","amount":1184.75,"currency":"USD","time":"10:19:12 AM","date":today_label,"location":"Chicago, IL","color":"pink"},
    {"id":"TXN-90821","initials":"MW","name":"Morgan Wells","card":"•••• 5204","merchant":"STUDIO PILATES CO","category":"Wellness","amount":38.00,"currency":"USD","time":"10:14:09 AM","date":today_label,"location":"Seattle, WA","color":"teal"},
    {"id":"TXN-90818","initials":"DL","name":"Drew Lewis","card":"•••• 0918","merchant":"PIXEL & PAPER","category":"Shopping","amount":1512.10,"currency":"USD","time":"10:09:33 AM","date":today_label,"location":"Denver, CO","color":"yellow","_initial_status":"Reviewed","note":"Confirmed with cardholder."},
    {"id":"TXN-90812","initials":"NP","name":"Noah Park","card":"•••• 4407","merchant":"EVERGREEN PHARMACY","category":"Health","amount":73.82,"currency":"USD","time":"09:58:42 AM","date":today_label,"location":"Boston, MA","color":"indigo"},
    {"id":"TXN-90808","initials":"EC","name":"Emerson Clark","card":"•••• 8136","merchant":"THE COMMONS CAFE","category":"Dining","amount":42.50,"currency":"USD","time":"09:51:27 AM","date":today_label,"location":"Brooklyn, NY","color":"lime","velocity_count":5,"velocity_window_minutes":10},
]


def matching_rules(transaction: dict) -> list[dict]:
    """Evaluate the synthetic attributes against the demo rule thresholds."""
    matches = []
    high_value = RULES[0]
    if high_value["enabled"] and transaction["amount"] >= high_value["amount_threshold"]:
        matches.append({"id": high_value["id"], "name": high_value["name"], "description": f"Single purchase exceeded ${high_value['amount_threshold']:,}"})

    velocity = RULES[1]
    count = transaction.get("velocity_count", 0)
    window = transaction.get("velocity_window_minutes", 0)
    if velocity["enabled"] and count >= velocity["transaction_threshold"] and 0 < window <= velocity["window_minutes"]:
        matches.append({"id": velocity["id"], "name": velocity["name"], "description": f"{count} transactions in {window} minutes"})
    return matches


transactions = []
for seed in seeded_transactions:
    row = deepcopy(seed)
    initial_status = row.pop("_initial_status", "Clear")
    matches = matching_rules(row)
    row["alerts"] = matches
    row["type"] = "High value" if any(rule["id"] == "high-value" for rule in matches) else "Velocity" if matches else "No alerts"
    row["rule"] = "; ".join(rule["description"] for rule in matches) if matches else "No rules matched"
    row["status"] = initial_status if initial_status == "Reviewed" else "Needs review" if matches else "Clear"
    row.setdefault("note", "")
    transactions.append(row)


class ReviewNote(BaseModel):
    note: str = Field(default="", max_length=1000)


@app.get("/health")
def health():
    return {"status": "ok", "service": "ledgerlens-api", "timestamp": datetime.now(timezone.utc).isoformat(), "synthetic": True}


@app.get("/api/transactions")
def list_transactions(status: Optional[str] = None, q: Optional[str] = None, alert_type: Optional[str] = None):
    rows = transactions
    if status:
        rows = [row for row in rows if row["status"].lower() == status.lower()]
    if alert_type:
        rows = [row for row in rows if row["type"].lower() == alert_type.lower()]
    if q:
        needle = q.lower()
        rows = [row for row in rows if needle in " ".join(str(row[key]) for key in ("id", "name", "merchant", "category")).lower()]
    return {"items": rows, "total": len(rows), "synthetic": True}


@app.get("/api/rules")
def get_rules():
    return {"items": RULES, "synthetic": True}


@app.post("/api/transactions/{transaction_id}/review")
def review_transaction(transaction_id: str, payload: ReviewNote):
    row = next((item for item in transactions if item["id"] == transaction_id), None)
    if row is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    row.update(status="Reviewed", note=payload.note, reviewed_at=datetime.now(timezone.utc).isoformat())
    return {"item": row, "synthetic": True}
