"""
Tests for experimental /api/scenarios/examples endpoint.
"""

import pytest
from fastapi.testclient import TestClient

from src.ai.orchestrator import app


client = TestClient(app)


@pytest.mark.unit
def test_get_scenario_examples_basic_shape():
    """Endpoint должен отдавать два сценария с минимально ожидаемой структурой."""
    response = client.get("/api/scenarios/examples")
    assert response.status_code == 200

    data = response.json()
    assert "scenarios" in data
    assert isinstance(data["scenarios"], list)
    assert len(data["scenarios"]) >= 2

    # Проверим один BA→Dev→QA сценарий
    first = data["scenarios"][0]
    assert "id" in first
    assert "goal" in first
    assert "steps" in first
    assert "overall_risk" in first
    assert "required_autonomy" in first


@pytest.mark.unit
def test_get_scenario_examples_with_autonomy():
    """При передаче autonomy должны появляться policy_decisions."""
    response = client.get("/api/scenarios/examples", params={"autonomy": "A2_non_prod_changes"})
    assert response.status_code == 200

    data = response.json()
    first = data["scenarios"][0]
    assert "policy_decisions" in first
    assert "autonomy_evaluated" in first
    assert isinstance(first["policy_decisions"], dict)


