# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security / Dependencies
- Tracked upstream issues for `starlette` (<0.42) и `urllib3` (>=2.5.0) — см. pip-audit отчёт и `README` (ограничения обновления до исправленных версий).
- План: обновить FastAPI/Starlette до версии, допускающей `starlette>=0.47`, и стек boto3/botocore до релиза с поддержкой `urllib3>=2.5.0`, затем повторно прогнать `pip-audit` и обновить данный раздел.

### Security / Tooling
- Добавлен скрипт `scripts/audit/check_secrets.py` и make-таргет `audit-secrets` для лёгкого локального сканирования возможных секретов (`analysis/secret_scan_report.json`).
 - Добавлен составной make-таргет `security-audit`, объединяющий `audit-hidden-dirs`, `audit-secrets`, `check_git_safety.py` и `comprehensive_project_audit.py` для полного security-аудита перед релизом.

### AI Agents / Testing
- Developer AI Secure: девгид и unit-тесты безопасности (approve flow, токены).
- QA Engineer AI: гайд, e2e-тесты маршрутизации и генерации тестов.
- Business Analyst Agent: интеграционные тесты Jira/Confluence/PowerBI/Docflow.
- LLM Diagnostics: скрипт и юнит-тесты для проверки доступности LLM-провайдеров.
- SQL Optimizer: unit-тесты и отдельный гайд (SQL_OPTIMIZER_GUIDE).
- TechLogAnalyzer / RAS Monitor / Issue Classifier: unit-тесты для анализа техлога, мониторинга кластера и ML/rule-based классификатора инцидентов.
 - AI Orchestrator: базовые unit-тесты для QueryClassifier и process_query (валидация, кэш, offline-мультисервис).
 - BA → Developer AI Secure → QA Engineer AI: добавлен сквозной system-тест `tests/system/test_e2e_ba_dev_qa.py` и гайд `docs/08-e2e-tests/BA_DEV_QA_E2E.md`.

### Observability / Performance
- Добавлен `docs/06-features/AI_PERFORMANCE_GUIDE.md` с обзором метрик Orchestrator/Kimi/Qwen, promql-запросами и рекомендациями по latency/cache hit rate.
- Тесты `tests/unit/test_ai_orchestrator_basic.py` дополнены проверкой метрик `orchestrator_cache_hits_total` и `orchestrator_cache_misses_total`.
 - Добавлен скрипт `scripts/testing/kimi_benchmark.py` для простых performance-бенчмарков Kimi-K2-Thinking.

### DevEx / Windows
- Добавлен Windows Quickstart (`docs/01-getting-started/windows_quickstart.md`) с шагами локального запуска AI-стека, тестов и security-аудита без GNU Make.
- README дополнен ссылкой на Windows Quickstart в разделе Usage/Быстрый старт.

### Spec-Driven Workflow
- В `comprehensive-testing.yml` добавлен job `spec-driven-validation`, выполняющий `make feature-validate` для проверки заполнения feature-спек на CI.

### Added
- Initial project structure
- Docker Compose infrastructure (PostgreSQL, Redis, Nginx)
- PostgreSQL schema for knowledge base
- Architecture documentation (architecture.yaml)
- Implementation plan (30 weeks roadmap)
- Setup scripts
- README and contributing guidelines

### Changed
- parse_edt_xml.py: Added PostgreSQL integration (in progress)

### Deprecated
- JSON knowledge base (will be replaced by Neo4j in Stage 1)

## [0.1.0] - 2025-01-XX

### Added
- Project initialization
- Basic infrastructure setup
- Documentation framework

---

## Version History

- **v0.1.0** - Initial setup (Stage 0, Week 1)
- **v1.0.0** - Planned: Full release (Stage 6, Week 30)

