import pytest
from unittest.mock import MagicMock, patch
import sys

from src.ai.orchestrator import AIOrchestrator
from src.ai.memory.schemas import MemorySource


@pytest.fixture
def mock_council_module():
    """Mock the src.ai.council module to avoid import errors and side effects."""
    mock_module = MagicMock()
    with patch.dict(sys.modules, {"src.ai.council": mock_module}):
        yield mock_module


@pytest.mark.asyncio
async def test_gam_initialization(mock_council_module):
    """Test that GAM components are initialized in Orchestrator."""
    with patch("src.ai.orchestrator.EventPublisher"), patch("src.ai.orchestrator.QueryClassifier"):
        orchestrator = AIOrchestrator()

        assert orchestrator.memorizer is not None
        assert orchestrator.context_compiler is not None


@pytest.mark.asyncio
async def test_gam_context_enrichment(mock_council_module):
    """Test that ContextCompiler enriches context."""
    with patch("src.ai.orchestrator.EventPublisher"), patch("src.ai.orchestrator.QueryClassifier") as MockClassifier:
        # Setup mocks
        orchestrator = AIOrchestrator()
        orchestrator.context_compiler = MagicMock()
        orchestrator.context_compiler.compile_briefing.return_value = "Briefing Content"

        MockClassifier.return_value.classify.return_value = MagicMock(query_type=MagicMock(value="test"))
        orchestrator.strategies = {}  # No strategies to avoid execution

        # Execute
        context = {"use_memory": True}
        await orchestrator.process_query("test query", context)

        # Verify
        orchestrator.context_compiler.compile_briefing.assert_called_with("test query")
        assert context["memory_briefing"] == "Briefing Content"


@pytest.mark.asyncio
async def test_gam_memorization(mock_council_module):
    """Test that successful interactions are memorized."""
    with patch("src.ai.orchestrator.EventPublisher"), patch("src.ai.orchestrator.QueryClassifier") as MockClassifier:
        # Setup mocks
        orchestrator = AIOrchestrator()
        orchestrator.memorizer = MagicMock()
        orchestrator.classifier.classify.return_value = MagicMock(query_type=MagicMock(value="test"))

        # Mock strategy execution to return success (AsyncMock for awaitable)
        from unittest.mock import AsyncMock

        orchestrator._execute_strategies = AsyncMock(return_value={"result": "success"})

        # Execute
        context = {"use_memory": True}
        await orchestrator.process_query("test query", context)

        # Verify
        orchestrator.memorizer.remember.assert_called_once()
        call_args = orchestrator.memorizer.remember.call_args
        assert "Query: test query" in call_args[1]["content"]
        assert call_args[1]["source"] == MemorySource.INFERENCE
