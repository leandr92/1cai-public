"""
Monitoring API Endpoints
Prometheus metrics export and health monitoring
"""

from fastapi import APIRouter
from src.monitoring.prometheus_metrics import metrics_endpoint
from src.services.health_checker import get_health_checker

router = APIRouter(prefix="/monitoring", tags=["Monitoring"])


@router.get("/metrics")
async def get_prometheus_metrics():
    """
    Prometheus metrics endpoint
    
    Scrape this endpoint with Prometheus:
    
    ```yaml
    scrape_configs:
      - job_name: '1c-ai-api'
        static_configs:
          - targets: ['api:8000']
        metrics_path: '/monitoring/metrics'
    ```
    """
    return await metrics_endpoint()


@router.get("/health/detailed")
async def detailed_health_check():
    """
    Detailed health check with all services
    
    Returns status of:
    - PostgreSQL
    - Redis  
    - Neo4j
    - Qdrant
    - Elasticsearch
    - OpenAI API
    """
    health_checker = get_health_checker()
    return await health_checker.check_all()


