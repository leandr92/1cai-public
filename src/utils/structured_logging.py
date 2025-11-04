"""
Structured Logging Setup
Quick Win #5: Better logging with correlation IDs
"""

import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict
from pythonjsonlogger import jsonlogger


class StructuredLogger:
    """
    Structured logging with correlation IDs
    
    Logs in JSON format for easy parsing in ELK/Splunk
    """
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.setup_json_logging()
    
    def setup_json_logging(self):
        """Setup JSON formatter"""
        
        # Create JSON formatter
        formatter = jsonlogger.JsonFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s %(request_id)s %(user_id)s %(tenant_id)s'
        )
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        
        # File handler
        file_handler = logging.FileHandler('logs/app.json.log')
        file_handler.setFormatter(formatter)
        
        self.logger.addHandler(console_handler)
        self.logger.addHandler(file_handler)
        self.logger.setLevel(logging.INFO)
    
    def log(
        self,
        level: str,
        message: str,
        request_id: str = None,
        user_id: str = None,
        tenant_id: str = None,
        **extra
    ):
        """Log with structured context"""
        
        log_data = {
            'timestamp': datetime.now().isoformat(),
            'message': message,
            'request_id': request_id,
            'user_id': user_id,
            'tenant_id': tenant_id,
            **extra
        }
        
        # Remove None values
        log_data = {k: v for k, v in log_data.items() if v is not None}
        
        log_func = getattr(self.logger, level.lower())
        log_func(message, extra=log_data)
    
    def info(self, message: str, **kwargs):
        self.log('info', message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        self.log('warning', message, **kwargs)
    
    def error(self, message: str, **kwargs):
        self.log('error', message, **kwargs)
    
    def debug(self, message: str, **kwargs):
        self.log('debug', message, **kwargs)


# Correlation ID middleware helper
def get_or_create_request_id(request) -> str:
    """Get or create correlation ID for request"""
    
    # Try to get from header (propagated from client)
    request_id = request.headers.get('X-Request-ID')
    
    if not request_id:
        # Generate new
        import uuid
        request_id = str(uuid.uuid4())
    
    return request_id


# Context manager for correlation
class LogContext:
    """Context manager for adding correlation data to logs"""
    
    def __init__(self, request_id: str = None, user_id: str = None, tenant_id: str = None):
        self.context = {
            'request_id': request_id,
            'user_id': user_id,
            'tenant_id': tenant_id
        }
    
    def __enter__(self):
        # TODO: Use contextvars to propagate context
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        pass


# Example usage:
"""
from src.utils.structured_logging import StructuredLogger

logger = StructuredLogger(__name__)

logger.info(
    "User login successful",
    request_id=request_id,
    user_id=user.id,
    tenant_id=user.tenant_id,
    ip_address=request.client.host
)

# Output (JSON):
{
  "timestamp": "2025-11-03T20:00:00",
  "level": "INFO",
  "name": "src.api.auth",
  "message": "User login successful",
  "request_id": "req-123",
  "user_id": "user-456",
  "tenant_id": "tenant-789",
  "ip_address": "192.168.1.1"
}
"""


