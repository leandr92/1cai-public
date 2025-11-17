# 🔗 BA-06 Integrations & Collaboration Guide

**Статус:** ✅ Реализовано  
**Версия:** 1.0.0  
**Дата:** Январь 2025  
**Связанные файлы:** 
- `src/ai/agents/business_analyst_agent_extended.py`
- `src/ai/agents/integrations_with_graph.py`
- `src/api/ba_sessions.py`

---

## 1. Цель BA-06

Сделать BA‑агента центром интеграций и совместной работы:

- синхронизация требований/артефактов с Jira/Confluence/ServiceNow/Docflow;
- генерация задач и страниц по результатам BA‑сессий;
- облегчение коммуникации между BA, Dev, QA, Product.

---

## 2. Планируемые возможности

1. **Requirements → Jira sync**
   - Автоматическая постановка эпиков/сторий/тасков на основе структурированных требований (BA‑02).
   - Поддержка тегов (команда, подсистема, приоритет, release train).

2. **Confluence / Wiki Publishing**
   - Публикация:
     - спецификаций,
     - процессных схем (BA‑03),
     - KPI‑таблиц (BA‑04)
   - Шаблоны страниц и авто‑ссылки на Jira‑таски.

3. **Collaboration Hooks**
   - Подготовка summary для созвонов/воркшопов (agenda, вопросы, риски).
   - Сбор action items и их раскладка по системам (Jira, Docflow, ServiceNow).

---

## 3. Как это будет встраиваться

- BA‑агент использует существующий `IntegrationConnector` (Jira/Confluence/PowerBI/Docflow) и добавляет:
  - «режимы» sync (draft, review, publish),
  - шаблоны для артефактов (страницы, задачи, отчёты).
- В связке с BA‑03/BA‑04:
  - Process/ Journey модели → страницы процесса;
  - KPI/аналитика → отчёты/дашборды и задачи по внедрению метрик.

---

## 4. Реализованная функциональность

### ✅ Integration Sync с Unified Change Graph

Реализован `IntegrationSyncWithGraph` (`src/ai/agents/integrations_with_graph.py`), который автоматически синхронизирует артефакты с внешними системами:

**Requirements → Jira Sync:**
- Автоматическое создание задач в Jira на основе требований из графа
- Автоматическое добавление ссылок на код (IMPLEMENTS)
- Автоматическое добавление ссылок на тесты (TESTED_BY)
- Автоматическое добавление ссылок на инциденты (TRIGGERS_INCIDENT)

**BPMN/KPI → Confluence Publishing:**
- Публикация BPMN моделей с диаграммами (Mermaid/PlantUML)
- Публикация KPI отчётов с таблицами и SQL-запросами
- Публикация Traceability matrix с таблицами и Risk Register
- Автоматические ссылки на код/тесты из графа

**Enhanced IntegrationConnector:**
- Расширен существующий `IntegrationConnector` для использования графа
- Обогащение артефактов ссылками на связанные узлы графа

### ✅ API Endpoints

Добавлены REST API endpoints в `src/api/ba_sessions.py`:

- `POST /ba-sessions/integrations/sync-requirements-jira` — синхронизировать требования в Jira
- `POST /ba-sessions/integrations/sync-bpmn-confluence` — синхронизировать BPMN в Confluence
- `POST /ba-sessions/integrations/sync-kpi-confluence` — синхронизировать KPI в Confluence
- `POST /ba-sessions/integrations/sync-traceability-confluence` — синхронизировать Traceability в Confluence

## 5. Использование

### Python API

```python
from src.ai.agents.business_analyst_agent_extended import BusinessAnalystAgentExtended

agent = BusinessAnalystAgentExtended()

# Синхронизировать требования в Jira
result = await agent.sync_requirements_to_jira(
    requirement_ids=["REQ001", "REQ002"],
    project_key="PROJ",
    issue_type="Story",
    use_graph=True,  # Использовать Unified Change Graph
)

# Синхронизировать BPMN в Confluence
bpmn_result = await agent.sync_bpmn_to_confluence(
    process_model=process_model,
    space_key="SPACE",
    use_graph=True,
)

# Синхронизировать KPI в Confluence
kpi_result = await agent.sync_kpi_to_confluence(
    kpi_report=kpi_report,
    space_key="SPACE",
    use_graph=True,
)
```

### REST API

```bash
# Синхронизировать требования в Jira
curl -X POST http://localhost:8000/ba-sessions/integrations/sync-requirements-jira \
    -H "Content-Type: application/json" \
    -d '{
        "requirement_ids": ["REQ001", "REQ002"],
        "project_key": "PROJ",
        "issue_type": "Story",
        "use_graph": true
    }'

# Синхронизировать BPMN в Confluence
curl -X POST http://localhost:8000/ba-sessions/integrations/sync-bpmn-confluence \
    -H "Content-Type: application/json" \
    -d '{
        "process_model": {"name": "Test Process", "steps": []},
        "space_key": "SPACE",
        "use_graph": true
    }'
```

## 6. Интеграция с Unified Change Graph

BA-06 автоматически использует Unified Change Graph для:
- Автоматического обогащения артефактов ссылками на код/тесты/инциденты
- Автоматического создания задач в Jira с полным контекстом
- Автоматической публикации в Confluence с перекрёстными ссылками

Если граф недоступен, используется базовый `IntegrationConnector` (fallback).

## 7. Тестирование

```bash
# Запустить unit-тесты
pytest tests/unit/test_integrations_with_graph.py -v
pytest tests/unit/test_business_analyst_integrations.py -v
```

## 8. См. также

- [`BUSINESS_ANALYST_GUIDE.md`](BUSINESS_ANALYST_GUIDE.md) — общий гайд по BA агенту
- [`BA_PROCESS_MODELLING_GUIDE.md`](BA_PROCESS_MODELLING_GUIDE.md) — BA-03 Process & Journey Modelling
- [`BA_ANALYTICS_KPI_GUIDE.md`](BA_ANALYTICS_KPI_GUIDE.md) — BA-04 Analytics & KPI Toolkit
- [`BA_TRACEABILITY_COMPLIANCE_GUIDE.md`](BA_TRACEABILITY_COMPLIANCE_GUIDE.md) — BA-05 Traceability & Compliance


