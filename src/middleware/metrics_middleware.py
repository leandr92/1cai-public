"""
Metrics Collection Middleware
Auto-collect metrics from all requests
"""

import logging
import time
from fastapi import Request
from src.monitoring.prometheus_metrics import track_request

logger = logging.getLogger(__name__)


async def metrics_middleware(request: Request, call_next):
    """
    Middleware to collect Prometheus metrics from all requests
    
    Tracks:
    - Request count by method, endpoint, status
    - Request duration
    - Response size
    """
    
    # Start timer
    start_time = time.time()
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration = time.time() - start_time
    
    # Get endpoint (remove query params, normalize path)
    endpoint = request.url.path
    
    # Normalize endpoint (replace IDs with placeholder)
    # /api/projects/123 → /api/projects/{id}
    import re
    endpoint = re.sub(r'/\d+', '/{id}', endpoint)
    endpoint = re.sub(r'/[a-f0-9-]{36}', '/{uuid}', endpoint)
    
    # Track metrics
    track_request(
        method=request.method,
        endpoint=endpoint,
        status_code=response.status_code,
        duration=duration,
        size=int(response.headers.get('content-length', 0))
    )
    
    # Add metrics to response headers (for debugging)
    response.headers['X-Process-Time'] = f"{duration:.3f}"
    
    return response


