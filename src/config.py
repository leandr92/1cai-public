"""
Конфигурация для AI-ассистентов
"""
import os
from typing import Dict, Any, List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Настройки приложения"""
    
    # OpenAI API
    openai_api_key: str = Field(..., description="API ключ OpenAI")
    
    # Supabase
    supabase_url: str = Field(..., description="URL Supabase проекта")
    supabase_key: str = Field(..., description="API ключ Supabase")
    
    # Конфигурация ассистентов
    assistant_configs: Dict[str, Dict[str, Any]] = {
        "architect": {
            "role": "architect",
            "name": "Архитектор AI",
            "description": "Специализированный ассистент для архитектурного анализа и проектирования",
            "temperature": 0.3,
            "max_tokens": 2000,
            "system_prompt": """Ты - опытный архитектор систем 1С с более чем 15-летним опытом работы.

Твоя специализация:
- Анализ бизнес-требований и их преобразование в архитектурные решения
- Проектирование масштабируемых и поддерживаемых систем 1С
- Оценка рисков и предложение мер по их минимизации
- Генерация архитектурных диаграмм в формате Mermaid

Всегда предоставляй:
1. Четкое объяснение принятых решений
2. Обоснование выбора архитектурных паттернов
3. Практические рекомендации по реализации
4. Визуализацию через диаграммы Mermaid

Используй профессиональную терминологию 1С и учитывай специфику российского рынка.""",
            "vector_store_config": {
                "table_name": "architect_knowledge",
                "similarity_threshold": 0.8
            }
        },
        "developer": {
            "role": "developer",
            "name": "Разработчик AI",
            "description": "Ассистент для помощи в разработке кода 1С",
            "temperature": 0.2,
            "max_tokens": 1500,
            "system_prompt": """Ты - опытный разработчик 1С с глубокими знаниями BSL, запросов и платформы.

Твоя специализация:
- Генерация кода на языке 1С (BSL)
- Оптимизация запросов 1С:Предприятие
- Code review и выявление антипаттернов
- Написание тестов и документации

Всегда предоставляй:
1. Готовый к использованию код
2. Объяснение логики работы
3. Рекомендации по оптимизации
4. Примеры тестирования""",
            "vector_store_config": {
                "table_name": "developer_knowledge",
                "similarity_threshold": 0.7
            }
        },
        "tester": {
            "role": "tester",
            "name": "Тестировщик AI",
            "description": "Ассистент для создания тестов и обеспечения качества",
            "temperature": 0.3,
            "max_tokens": 1500,
            "system_prompt": """Ты - эксперт по тестированию систем 1С с опытом автоматизации QA.

Твоя специализация:
- Создание тестовых сценариев
- Анализ покрытия тестами
- Выявление критических путей тестирования
- Генерация тестовых данных

Всегда предоставляй:
1. Структурированные тестовые сценарии
2. Классы эквивалентности и граничные значения
3. Рекомендации по автоматизации
4. Метрики качества тестирования""",
            "vector_store_config": {
                "table_name": "tester_knowledge",
                "similarity_threshold": 0.75
            }
        },
        "pm": {
            "role": "project_manager",
            "name": "Менеджер проектов AI",
            "description": "Ассистент для управления проектами и планирования",
            "temperature": 0.4,
            "max_tokens": 1200,
            "system_prompt": """Ты - опытный менеджер проектов 1С с PMP сертификацией.

Твоя специализация:
- Планирование этапов внедрения 1С
- Оценка временных и ресурсных затрат
- Управление рисками проекта
- Координация команды разработчиков

Всегда предоставляй:
1. Детальные планы работ
2. Оценку рисков и сроков
3. Рекомендации по ресурсам
4. KPI для мониторинга прогресса""",
            "vector_store_config": {
                "table_name": "pm_knowledge",
                "similarity_threshold": 0.7
            }
        },
        "analyst": {
            "role": "business_analyst",
            "name": "Бизнес-аналитик AI",
            "description": "Ассистент для анализа бизнес-требований и процессов",
            "temperature": 0.3,
            "max_tokens": 1500,
            "system_prompt": """Ты - опытный бизнес-аналитик с опытом внедрения 1С.

Твоя специализация:
- Извлечение требований из бизнес-документов
- Моделирование бизнес-процессов
- Анализ функциональных требований
- Создание пользовательских историй

Всегда предоставляй:
1. Структурированные требования
2. Диаграммы процессов
3. User stories с критериями приемки
4. Анализ пробелов в функциональности""",
            "vector_store_config": {
                "table_name": "analyst_knowledge",
                "similarity_threshold": 0.8
            }
        }
    }
    
    # База данных
    database_url: str = Field(..., description="URL базы данных")
    
    # Redis для кэширования
    redis_url: str = Field(default="redis://localhost:6379", description="URL Redis")
    
    # CORS настройки
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:5173",
        description="Разрешенные домены для CORS (через запятую)"
    )
    
    # JWT настройки
    jwt_secret_key: Optional[str] = Field(default=None, description="Секретный ключ для JWT")
    jwt_algorithm: str = Field(default="HS256", description="Алгоритм подписи JWT")
    jwt_access_token_expire_minutes: int = Field(default=30, description="Время жизни access token в минутах")
    
    # Путь к логам
    log_dir: str = Field(default="./logs", description="Директория для логов")
    log_file: str = Field(default="app.log", description="Имя файла лога")
    
    # Режим разработки (для development можно разрешить небезопасные настройки)
    environment: str = Field(default="production", description="Режим работы: development/production")

    # Внешние MCP-инструменты
    mcp_bsl_context_base_url: Optional[str] = Field(
        default=None,
        description="Базовый URL MCP сервера платформенного контекста (например, alkoleft/mcp-bsl-platform-context)",
    )
    mcp_bsl_context_tool_name: str = Field(
        default="platform_context",
        description="Название инструмента на внешнем MCP сервере для получения платформенного контекста",
    )
    mcp_bsl_context_auth_token: Optional[str] = Field(
        default=None,
        description="Bearer-токен для аутентификации на MCP сервере платформенного контекста (опционально)",
    )
    mcp_bsl_test_runner_base_url: Optional[str] = Field(
        default=None,
        description="Базовый URL MCP сервера тест-раннера (например, alkoleft/mcp-onec-test-runner)",
    )
    mcp_bsl_test_runner_tool_name: str = Field(
        default="run_tests",
        description="Название инструмента на MCP сервере тест-раннера",
    )
    mcp_bsl_test_runner_auth_token: Optional[str] = Field(
        default=None,
        description="Bearer-токен для аутентификации на MCP сервере тест-раннера (опционально)",
    )
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    def get_cors_origins(self) -> List[str]:
        """Получить список разрешенных доменов для CORS"""
        if self.environment == "development" and not self.cors_origins:
            return ["*"]  # Только для development
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
    
    def get_log_path(self) -> str:
        """Получить полный путь к файлу лога"""
        import os
        from pathlib import Path
        log_dir = Path(self.log_dir)
        log_dir.mkdir(parents=True, exist_ok=True)
        return str(log_dir / self.log_file)


# Создаем глобальный экземпляр настроек
settings = Settings()