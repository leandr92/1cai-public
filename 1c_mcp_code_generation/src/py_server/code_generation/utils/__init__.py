#!/usr/bin/env python3
"""
Utils Package для 1C AI MCP Code Generation

Пакет утилитарных функций для системы генерации кода.

Версия: 1.0
Дата: 30.10.2025
"""

from .audit import AuditLogger, AuditEvent
from .context import ContextCollector, ConfigurationContext

__version__ = "1.0.0"
__all__ = ['AuditLogger', 'AuditEvent', 'ContextCollector', 'ConfigurationContext']