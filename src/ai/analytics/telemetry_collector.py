"""
Telemetry Collector
-------------------

Collects metrics from EventBus and exposes them to Prometheus.
Part of Phase 1: Instrumentation for Self-Evolving AI.
"""

import logging
from typing import Dict, Any, Set

from prometheus_client import Counter, Histogram, Gauge

from src.infrastructure.event_bus import EventHandler, Event, EventType, get_event_bus

logger = logging.getLogger(__name__)

# Prometheus Metrics
AI_FEEDBACK_TOTAL = Counter(
    "ai_evolution_feedback_total",
    "Total number of user feedback received",
    ["agent", "rating", "accepted"]
)

STRATEGY_PERFORMANCE = Histogram(
    "ai_evolution_strategy_duration_seconds",
    "Duration of strategy execution",
    ["service", "status"]
)

STRATEGY_SUCCESS_RATE = Gauge(
    "ai_evolution_strategy_success_rate",
    "Success rate of strategies (moving average)",
    ["service"]
)

CODE_ERRORS_TOTAL = Counter(
    "ai_evolution_code_errors_total",
    "Total number of code generation errors",
    ["error_type", "language"]
)


class TelemetryCollector(EventHandler):
    """
    Collects telemetry from system events and updates Prometheus metrics.
    """

    def __init__(self):
        self._strategy_stats: Dict[str, Dict[str, int]] = {}

    @property
    def event_types(self) -> Set[EventType]:
        return {
            EventType.AI_FEEDBACK_RECEIVED,
            EventType.STRATEGY_PERFORMANCE_RECORDED,
            EventType.CODE_ERROR_DETECTED,
            EventType.AI_AGENT_COMPLETED,
            EventType.AI_AGENT_FAILED
        }

    async def handle(self, event: Event) -> None:
        """Handle event and update metrics"""
        try:
            if event.type == EventType.AI_FEEDBACK_RECEIVED:
                self._handle_feedback(event.payload)
            elif event.type == EventType.STRATEGY_PERFORMANCE_RECORDED:
                self._handle_strategy_performance(event.payload)
            elif event.type == EventType.CODE_ERROR_DETECTED:
                self._handle_code_error(event.payload)
            elif event.type == EventType.AI_AGENT_COMPLETED:
                self._handle_agent_completion(event.payload, success=True)
            elif event.type == EventType.AI_AGENT_FAILED:
                self._handle_agent_completion(event.payload, success=False)

        except Exception as e:
            logger.error(f"Failed to process telemetry event: {e}", exc_info=True)

    def _handle_feedback(self, payload: Dict[str, Any]):
        agent = payload.get("agent", "unknown")
        rating = payload.get("rating", 0)
        accepted = payload.get("accepted", False)
        
        AI_FEEDBACK_TOTAL.labels(
            agent=agent,
            rating=str(rating),
            accepted=str(accepted).lower()
        ).inc()

    def _handle_strategy_performance(self, payload: Dict[str, Any]):
        service = payload.get("service", "unknown")
        duration = payload.get("duration", 0.0)
        success = payload.get("success", False)
        
        STRATEGY_PERFORMANCE.labels(
            service=service,
            status="success" if success else "failure"
        ).observe(duration)

        # Update success rate (simplified moving average)
        if service not in self._strategy_stats:
            self._strategy_stats[service] = {"total": 0, "success": 0}
        
        stats = self._strategy_stats[service]
        stats["total"] += 1
        if success:
            stats["success"] += 1
            
        rate = stats["success"] / stats["total"]
        STRATEGY_SUCCESS_RATE.labels(service=service).set(rate)

    def _handle_code_error(self, payload: Dict[str, Any]):
        error_type = payload.get("error_type", "unknown")
        language = payload.get("language", "unknown")
        
        CODE_ERRORS_TOTAL.labels(
            error_type=error_type,
            language=language
        ).inc()

    def _handle_agent_completion(self, payload: Dict[str, Any], success: bool):
        # Additional agent metrics can be added here
        pass


def register_telemetry_collector():
    """Register collector with EventBus"""
    bus = get_event_bus()
    collector = TelemetryCollector()
    
    for event_type in collector.event_types:
        bus.subscribe(event_type, collector)
    
    logger.info("TelemetryCollector registered")
