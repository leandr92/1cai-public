import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from src.ai.optimization.strategy_selector import StrategySelector
from src.ai.optimization.strike_3_reflector import Strike3Reflector
from src.ai.query_classifier import AIService
from src.infrastructure.git.git_automation import GitAutomation, PullRequest


# --- StrategySelector Tests ---
def test_strategy_selector_initialization():
    selector = StrategySelector()
    assert selector._default_alpha == 1
    assert selector._default_beta == 1


def test_strategy_selector_selection():
    selector = StrategySelector()
    services = [AIService.QWEN_CODER, AIService.KIMI_K2]

    # Should return one of the available services
    selected = selector.select_strategy(services, "code_generation")
    assert selected in services


def test_strategy_selector_feedback():
    selector = StrategySelector()
    service = AIService.QWEN_CODER
    query_type = "code_generation"

    # Initial state
    alpha_pre, beta_pre = selector._get_params(f"{service.value}:{query_type}")

    # Positive feedback
    selector.update_feedback(service, query_type, success=True)
    alpha_post, beta_post = selector._get_params(f"{service.value}:{query_type}")

    assert alpha_post == alpha_pre + 1
    assert beta_post == beta_pre

    # Negative feedback
    selector.update_feedback(service, query_type, success=False)
    alpha_final, beta_final = selector._get_params(f"{service.value}:{query_type}")

    assert beta_final == beta_post + 1


# --- Strike3Reflector Tests ---
@pytest.mark.asyncio
async def test_strike3_reflector_positive_critique():
    mock_strategy = AsyncMock()
    mock_strategy.execute.return_value = "LGTM"

    reflector = Strike3Reflector(mock_strategy)
    result = await reflector.refine("query", "initial_code")

    assert result["response"] == "initial_code"
    assert result["refinement_process"]["strike_3_verdict"] == "kept_initial"


@pytest.mark.asyncio
async def test_strike3_reflector_refinement():
    mock_strategy = AsyncMock()
    # First call (critique): returns issues
    # Second call (refinement): returns fixed code
    mock_strategy.execute.side_effect = ["Found bug", "Fixed code"]

    reflector = Strike3Reflector(mock_strategy)
    result = await reflector.refine("query", "initial_code")

    assert result["response"] == "Fixed code"
    assert result["refinement_process"]["strike_3_verdict"] == "refined"


# --- GitAutomation Tests (Safety) ---
@pytest.mark.asyncio
async def test_git_automation_safety_check():
    git = GitAutomation()

    # Should fail for protected branches
    assert await git.check_branch_safety("main") is False
    assert await git.check_branch_safety("production") is False

    # Should pass for feature branches
    assert await git.check_branch_safety("feature/new-ai") is True


@pytest.mark.asyncio
async def test_git_automation_pr_creation():
    git = GitAutomation()
    pr = PullRequest("Title", "Desc", "feature/branch")

    # Mocking internal simulation logging/calls
    pr_id = await git.create_pull_request(pr)
    assert pr_id.startswith("PR-")
