# 📚 BA-07 Documentation & Enablement Guide

**Статус:** ✅ Реализовано  
**Версия:** 1.0.0  
**Дата:** Январь 2025  
**Связанные файлы:** 
- `src/ai/agents/business_analyst_agent_extended.py`
- `src/ai/agents/enablement_with_graph.py`
- `src/api/ba_sessions.py`

---

## 1. Цель BA-07

Сделать BA‑агента инструментом «enablement» для команды:

- готовить понятные гайды и примеры для BA/Dev/QA/Product;
- автоматизировать шаблоны презентаций, воркшопов и onboarding‑материалов;
- поддерживать единый «BA knowledge hub» вокруг 1C AI Stack.

---

## 2. Планируемые возможности

1. **Playbooks & Guides**
   - Генерация:
     - кратких how‑to по BA‑функционалу платформы (EDT, MCP, AI‑агенты),
     - сценариев использования (use case library).

2. **Presentations & Storytelling**
   - Подготовка outline/набросков презентаций:
     - для стейкхолдеров (executive/ops/product),
     - для внутренних демо и тренингов.

3. **Onboarding & Training**
   - Чек‑листы для новых BA в команде:
     - что прочитать,
     - какие сценарии попробовать,
     - какие метрики отслеживать.

---

## 3. Как это будет встраиваться

- BA‑агент опирается на:
  - `docs/research/ba_agent_roadmap.md`,
  - существующие гайды (`BUSINESS_ANALYST_GUIDE`, BA‑03, BA‑04, BA‑05),
  - документацию по DevOps/observability/DR.
- Возвращает:
  - структурированные материалы (списки, outline, TODO‑матрицы),
  - ссылки на релевантные части документации,
  - подсказки по форматам (Confluence, PowerPoint, Markdown).

---

## 4. Реализованная функциональность

### ✅ Enablement Generator с Unified Change Graph

Реализован `EnablementGeneratorWithGraph` (`src/ai/agents/enablement_with_graph.py`), который автоматически генерирует enablement-материалы на основе реальных артефактов из графа:

**Enablement Plan:**
- Генерация плана enablement-материалов для фичи
- Автоматический поиск примеров использования в графе
- Модули: Overview, How-to, Observability

**Guide Generation:**
- Генерация гайдов по теме с примерами кода из графа
- Автоматический поиск связанных требований
- Экспорт в форматы: Markdown, Confluence, HTML

**Presentation Outline:**
- Генерация outline презентаций для разных аудиторий
- Автоматическое обогащение метриками из графа
- Адаптация под аудиторию (stakeholders, technical, executive)

**Onboarding Checklist:**
- Генерация onboarding чек-листов для ролей (BA, Dev, QA, Product)
- Автоматический поиск практических задач из графа
- Автоматический поиск метрик для отслеживания

### ✅ API Endpoints

Добавлены REST API endpoints в `src/api/ba_sessions.py`:

- `POST /ba-sessions/enablement/plan` — сгенерировать план enablement-материалов
- `POST /ba-sessions/enablement/guide` — сгенерировать гайд по теме
- `POST /ba-sessions/enablement/presentation` — сгенерировать outline презентации
- `POST /ba-sessions/enablement/onboarding-checklist` — сгенерировать onboarding чек-лист

## 5. Использование

### Python API

```python
from src.ai.agents.business_analyst_agent_extended import BusinessAnalystAgentExtended

agent = BusinessAnalystAgentExtended()

# Сгенерировать план enablement-материалов
plan = await agent.build_enablement_plan(
    feature_name="New Feature",
    audience="BA+Dev+QA",
    include_examples=True,
    use_graph=True,  # Использовать Unified Change Graph
)

# Сгенерировать гайд
guide = await agent.generate_guide(
    topic="Process Modelling",
    format="markdown",
    include_code_examples=True,
    use_graph=True,
)

# Сгенерировать outline презентации
presentation = await agent.generate_presentation_outline(
    topic="AI Agents Platform",
    audience="stakeholders",
    duration_minutes=30,
    use_graph=True,
)

# Сгенерировать onboarding чек-лист
checklist = await agent.generate_onboarding_checklist(
    role="BA",
    include_practical_tasks=True,
    use_graph=True,
)
```

### REST API

```bash
# Сгенерировать план enablement-материалов
curl -X POST http://localhost:8000/ba-sessions/enablement/plan \
    -H "Content-Type: application/json" \
    -d '{
        "feature_name": "New Feature",
        "audience": "BA+Dev+QA",
        "include_examples": true,
        "use_graph": true
    }'

# Сгенерировать гайд
curl -X POST http://localhost:8000/ba-sessions/enablement/guide \
    -H "Content-Type: application/json" \
    -d '{
        "topic": "Process Modelling",
        "format": "markdown",
        "include_code_examples": true,
        "use_graph": true
    }'

# Сгенерировать onboarding чек-лист
curl -X POST http://localhost:8000/ba-sessions/enablement/onboarding-checklist \
    -H "Content-Type: application/json" \
    -d '{
        "role": "BA",
        "include_practical_tasks": true,
        "use_graph": true
    }'
```

## 6. Интеграция с Unified Change Graph

BA-07 автоматически использует Unified Change Graph для:
- Автоматического поиска примеров использования в графе
- Автоматического поиска связанных требований и кода
- Автоматического обогащения материалов реальными данными

Если граф недоступен, используется базовый подход с шаблонными материалами (fallback).

## 7. Тестирование

```bash
# Запустить unit-тесты
pytest tests/unit/test_enablement_with_graph.py -v
```

## 8. См. также

- [`BUSINESS_ANALYST_GUIDE.md`](BUSINESS_ANALYST_GUIDE.md) — общий гайд по BA агенту
- [`BA_PROCESS_MODELLING_GUIDE.md`](BA_PROCESS_MODELLING_GUIDE.md) — BA-03 Process & Journey Modelling
- [`BA_ANALYTICS_KPI_GUIDE.md`](BA_ANALYTICS_KPI_GUIDE.md) — BA-04 Analytics & KPI Toolkit
- [`BA_TRACEABILITY_COMPLIANCE_GUIDE.md`](BA_TRACEABILITY_COMPLIANCE_GUIDE.md) — BA-05 Traceability & Compliance
- [`BA_INTEGRATIONS_COLLAB_GUIDE.md`](BA_INTEGRATIONS_COLLAB_GUIDE.md) — BA-06 Integrations & Collaboration


