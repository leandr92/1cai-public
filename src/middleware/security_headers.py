"""
Security Headers Middleware
Iteration 2 Quick Win #1: Enhanced browser security
"""

from fastapi import Request, Response
from typing import Callable


async def security_headers_middleware(request: Request, call_next: Callable) -> Response:
    """
    Add security headers to all responses
    
    Headers:
    - Content-Security-Policy: Prevents XSS
    - X-Frame-Options: Prevents clickjacking
    - X-Content-Type-Options: Prevents MIME sniffing
    - Strict-Transport-Security: Forces HTTPS
    - Referrer-Policy: Controls referrer info
    - Permissions-Policy: Controls browser features
    """
    
    response = await call_next(request)
    
    # Content Security Policy
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self' https://api.openai.com; "
        "frame-ancestors 'none';"
    )
    
    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'DENY'
    
    # Prevent MIME sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    
    # Force HTTPS (only in production)
    if request.url.scheme == 'https':
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    # Referrer policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Permissions policy (disable unnecessary features)
    response.headers['Permissions-Policy'] = (
        'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    )
    
    # XSS Protection (legacy, but doesn't hurt)
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    return response


