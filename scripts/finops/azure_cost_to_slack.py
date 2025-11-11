#!/usr/bin/env python3
"""Send Azure Cost Management report to Slack webhook."""

from __future__ import annotations

import datetime as dt
import os
from typing import Dict

import requests
from azure.identity import ClientSecretCredential
from azure.mgmt.costmanagement import CostManagementClient

WEBHOOK_URL = os.environ.get("SLACK_WEBHOOK_URL")
TENANT_ID = os.environ["AZURE_TENANT_ID"]
CLIENT_ID = os.environ["AZURE_CLIENT_ID"]
CLIENT_SECRET = os.environ["AZURE_CLIENT_SECRET"]
SUBSCRIPTION_ID = os.environ["AZURE_SUBSCRIPTION_ID"]


def fetch_costs(days: int = 3) -> Dict[str, float]:
    credential = ClientSecretCredential(
        tenant_id=TENANT_ID,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
    )
    client = CostManagementClient(credential)

    end = dt.date.today()
    start = end - dt.timedelta(days=days)

    report = client.query.usage(
        scope=f"subscriptions/{SUBSCRIPTION_ID}",
        parameters={
            "type": "Usage",
            "timeframe": "Custom",
            "timePeriod": {
                "from": dt.datetime.combine(start, dt.time.min).isoformat(),
                "to": dt.datetime.combine(end, dt.time.min).isoformat(),
            },
            "dataset": {
                "granularity": "Daily",
                "aggregation": {"totalCost": {"name": "PreTaxCost", "function": "Sum"}},
            },
        },
    )

    results: Dict[str, float] = {}
    for row in report.rows:  # type: ignore[attr-defined]
        date = row[0]
        amount = float(row[1])
        results[date] = amount
    return results


def post_to_slack(costs: Dict[str, float], provider: str) -> None:
    if not WEBHOOK_URL:
        raise RuntimeError("SLACK_WEBHOOK_URL is not set")
    lines = [f"• {date}: ${amount:.2f}" for date, amount in sorted(costs.items())]
    text = f"{provider} Cost Report (last 3 days)\n" + "\n".join(lines)
    resp = requests.post(WEBHOOK_URL, json={"text": text}, timeout=10)
    resp.raise_for_status()


def main() -> None:
    costs = fetch_costs()
    post_to_slack(costs, "Azure")


if __name__ == "__main__":
    main()
