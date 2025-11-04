"""
Тестовый пакет для AI Assistant системы 1C.

Содержит unit тесты, интеграционные тесты и end-to-end тесты
для проверки всех компонентов системы.
"""

__version__ = "1.0.0"
__author__ = "AI Assistant Development Team"

# Импортируем все тестовые модули для удобства
try:
    from . import integration
    from . import unit
except ImportError:
    # Модули могут отсутствовать при первом запуске
    pass