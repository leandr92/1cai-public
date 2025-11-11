# Business Analyst Agent — Roadmap (Q4 2025 → Q1 2026)

Дата: 11 ноября 2025  
На основе исследования: `docs/research/job_market_business_analyst.md`

---

## 0. Цели

1. Довести BA-агент до уровня senior/lead BA требований (RU/EU/US).  
2. Обеспечить сквозной процесс: требования → процессы → аналитика → roadmap → traceability.  
3. Интегрировать BA-агента в экосистему DevOps/QA/Tech Writer агентов, обеспечить измеримый ROI.

---

## 1. Фазы и сроки

| Фаза | Период | Основные результаты | Зависимости |
|------|--------|--------------------|-------------|
| **BA-01 Research & Foundations** | завершено (2025-11-11) | Исследование рынка, обновление документации, уточнение требований ↔ ✅ `job_market_business_analyst.md` | — |
| **BA-02 Requirements Intelligence** | 2025-11-12 → 2025-11-22 | LLM/NLP извлечение требований, user stories, acceptance criteria; поддержка docx/pdf/md; CLI `ba-extract`; unit-тесты | Доступы к GigaChat/YandexGPT, Vault secrets |
| **BA-03 Process & Journey Modelling** | 2025-11-18 → 2025-12-02 | Расширенный BPMN 2.0 (actors/swimlanes/events), Customer Journey Map, Service Blueprint, экспорт в SVG/PlantUML; Make `ba-bpmn` | BA-02 (стейкхолдеры, события), интеграция с bpmn-js |
| **BA-04 Analytics & KPI Toolkit** | 2025-11-28 → 2025-12-13 | SQL/BI слой, шаблоны Power BI/Tableau, расчёт OKR/ROI/DORA, связь с FinOps; CLI `ba-kpi`; интеграция с Observability | Доступы к демо-DWH, согласование метрик |
| **BA-05 Traceability, Risk & Compliance** | 2025-12-10 → 2025-12-24 | Матрица требований ↔ тесты ↔ релизы ↔ риски, Risk Register (GDPR/SOX), автогенерация roadmap/OKR; интеграция с QA/DevOps агентами | BA-04 (метрики), QA agent APIs |
| **BA-06 Integrations & Collaboration** | 2026-01-08 → 2026-01-26 | REST-клиенты Jira/Confluence/ServiceNow, синхронизация артефактов, комментарии, контроль доступа; CLI `ba-sync`; Vault secrets | ITSM доступы, security review |
| **BA-07 Documentation & Enablement** | 2026-01-15 → 2026-01-31 | Руководство `docs/03-ai-agents/BUSINESS_ANALYST_GUIDE.md`, примеры (`examples/ba_*`), видео-демо, обновление README/CHANGELOG; KPI-дашборд | BA-02…BA-06 |

---

## 2. Детализация задач по фазам

### BA-02 Requirements Intelligence
- Интеграция GigaChat/YandexGPT (через `src/ai/clients/`), управление ключами → Vault + `.env.template`.  
- NER (Natasha/spacy) для извлечения ролей, сущностей, приоритетов (MoSCoW), ссылок на источники.  
- Поддержка входных форматов: `.docx`, `.pdf`, `.md`, `.txt`, `.xlsx` (сценарии backlog).  
- Генерация артефактов: FR/NFR/constraints, user stories (INVEST), acceptance criteria (Given/When/Then), SRS/BRD шаблоны.  
- `scripts/ba/requirements_cli.py` + Make `ba-extract`; unit-тесты (`tests/unit/test_ba_requirements.py`) + snapshot-фикстуры.  
- Обновление JSON-схемы результирующих данных (`schemas/ba/requirements.schema.json`).  

### BA-03 Process & Journey Modelling
- Расширение BPMN: акторы (lane), события, шлюзы, комментарии; связывание с FR/NFR.  
- Модули генерации CJM/Service Blueprint (табличный + Mermaid/PlantUML).  
- Экспорт: BPMN 2.0 XML (Camunda compliant), SVG/PDF (через `bpmn-to-image`).  
- CLI `scripts/ba/process_cli.py`; Make `ba-bpmn`.  
- Юнит/интеграционные тесты (`tests/unit/test_ba_bpmn.py`).  

### BA-04 Analytics & KPI Toolkit
- SQL генерация (LLM + шаблоны) для OLTP/OLAP; интеграция с демо-data warehouse.  
- Шаблоны BI-досок (Power BI, Tableau, Grafana JSON), автогенерация KPI (OKR, ROI, DORA, Lead/Cycle time).  
- CLI `scripts/ba/kpi_cli.py`, Make `ba-kpi`; экспорт в CSV/Excel.  
- Связь с FinOps (`scripts/finops/`), Observability (Prometheus exporters).  
- Тесты (`tests/unit/test_ba_kpi.py`).  

### BA-05 Traceability, Risk & Compliance
- Матрица tracing: Requirement ↔ Test ↔ Release ↔ Risk ↔ Control, визуализация heatmap.  
- Risk Register: шаблоны (impact/probability, mitigation), GDPR/SOX чек-листы.  
- Roadmap генератор (phases, OKR, timelines) → Markdown/Excel/JSON.  
- Интеграция с QA/DevOps: чтение тестов, ссылок на pipelines, incidents.  
- CLI `scripts/ba/traceability_cli.py`.  

### BA-06 Integrations & Collaboration
- API-клиенты Jira (REST/GraphQL), Confluence, ServiceNow; настройки в Vault.  
- Синхронизация артефактов: создание/обновление задач, страниц, комментариев.  
- Настройка прав доступа, logging (PII redaction), retry/rate limiting.  
- Preflight чек (`make ba-preflight`) проверяет токены/доступы.  

### BA-07 Documentation & Enablement
- `docs/03-ai-agents/BUSINESS_ANALYST_GUIDE.md`: Quick start, CLI, API, best practices.  
- Примеры (`examples/ba_requirements.py`, `ba_gap_analysis.ipynb`, `ba_sync_jira.py`).  
- Обновление README/CHANGELOG, подготовка release notes (BA Agent v1.0).  
- KPI dashboard (Grafana JSON + Prometheus exporter), интеграция с Observability.  
- Enablement материалы: гайд, видео walkthrough, FAQ.  

---

## 3. Технические и операционные требования

- **LLM конфиденциальность:** шифрование ключей (Vault), PII scrubber, политика логирования.  
- **Quality gates:** Ruff/Flake8, MyPy, unit & integration tests (pytest + snapshot), docs lint.  
- **CI/CD:** GitHub Actions / Jenkins — добавить джобы `ba-tests`, `ba-cli-check`, `ba-docs`.  
- **Security:** OPA/Conftest правила (запрет логирования токенов), секреты в `.gitignore`, ротация ключей.  
- **Observability:** Prometheus metrics (время извлечения, наличие ошибок LLM, количество синхронизированных артефактов).  

---

## 4. Метрики успеха (KPI)

| KPI | Цель к 2026-01 | Комментарий |
|-----|----------------|-------------|
| Точность извлечения требований (ручная валидация) | ≥ 85% | По выборке из 10 документов |
| Время обработки ТЗ (20 стр.) | ≤ 3 мин | До 30 мин вручную |
| Покрытие требований тестами | +25 п.п. | За счёт traceability |
| Автогенерация BPMN/CJM | 100% кейсов с корректной валидацией | Ручное редактирование ≤10% |
| Интеграция Jira/Confluence | ≥ 90% успешных синхронизаций | Ошибки → retry/backoff |
| ROI BA-агента | +€30k/год | Обновление `FINAL_PROJECT_SUMMARY.md` |

---

## 5. Риски и меры

| Риск | Влияние | Вероятность | Митигация |
|------|---------|-------------|-----------|
| Ограничения API LLM (rate limit, политика данных) | Высокое | Средняя | Кэширование, fallback, оффлайн модели |
| Недоступность корпоративных систем (Jira/ServiceNow) | Среднее | Средняя | Тестовые sandbox, mock-клиенты |
| Неполнота данных для KPI (нет DWH) | Среднее | Высокая | Синтетические датасеты, интеграция с FinOps |
| PII/комплаенс риски | Высокое | Средняя | Data scrubber, audit log, security review |
| Выгорание команды (длина roadmap) | Среднее | Средняя | Инкрементальная поставка, демо каждые 2 недели |

---

## 6. Матрица зависимостей

- BA-02 → BA-03 (actors/events для BPMN).  
- BA-02 → BA-05 (требования для traceability).  
- BA-04 ↔ FinOps/Observability (метрики).  
- BA-05 ↔ QA Agent (тесты), DevOps Agent (pipelines).  
- BA-06 требует секретов (Vault) и security review.  
- BA-07 зависит от завершения функций и наличия примеров.

---

## 7. Артефакты и контрольные точки

- **Roadmap board**: Kanban в Jira/Linear (ссылка в Confluence).  
- **Demo cadence**: каждые 2 недели — демонстрация новых возможностей BA-агента.  
- **Документация**: обновлять `docs/research/README_LOCAL.md` по завершении каждой фазы.  
- **Release plan**: BA Agent v1.0 (2026-01-31), v1.1 (2026-03-31) — расширения AI/automation.  

---

**Ответственные**:  
- LLM/NLP — @ai-team.  
- BPMN/CJM, визуализация — @process-lab.  
- KPI/FinOps интеграция — @analytics.  
- Интеграции (Jira/Confluence/ServiceNow) — @platform.  
- Документация и enablement — @tech-writer.  

Контроль прогресса — через `docs/research/alkoleft_todo.md` и еженедельные отчёты. 

