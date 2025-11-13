# 🤖 1C AI Stack

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/downloads/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/kubernetes-ready-326CE5.svg)](https://kubernetes.io/)
[![Status](https://img.shields.io/badge/status-production-green.svg)](CHANGELOG.md)
[![Documentation](https://img.shields.io/badge/docs-complete-brightgreen.svg)](docs/README.md)

> **Автоматизируйте разработку 1C:Enterprise с помощью AI и DevOps практик**

Устали от рутинного парсинга конфигураций? Хотите автоматизировать анализ кода и генерацию документации? 
1C AI Stack — это комплексная платформа, которая превращает вашу работу с 1C в современный DevOps workflow.

**Что вы получите:**
- ⚡ Автоматический анализ конфигураций 1C за минуты вместо часов
- 🤖 AI-ассистенты для разработки, тестирования и code review
- 🔄 CI/CD pipeline из коробки с поддержкой Kubernetes
- 📊 Мониторинг, observability и автоматические отчеты
- 🔒 Security-first подход с автоматическим сканированием

[🚀 Начать работу за 5 минут](docs/01-getting-started/START_HERE.md) | 
[📖 Полная документация](docs/README.md) | 
[💬 Обсуждения](https://github.com/DmitrL-dev/1cai/discussions) |
[🐛 Сообщить о проблеме](https://github.com/DmitrL-dev/1cai/issues/new)

---

## 🔍 Быстрая навигация

| Я хочу... | Смотри здесь |
|-----------|--------------|
| 🚀 **Начать работу** | [Quick Start за 5 минут](docs/01-getting-started/START_HERE.md) |
| 🏗️ **Понять архитектуру** | [Architecture Overview](docs/02-architecture/ARCHITECTURE_OVERVIEW.md) |
| 🔌 **Настроить MCP** | [MCP Server Guide](docs/06-features/MCP_SERVER_GUIDE.md) |
| 🐛 **Решить проблему** | [Troubleshooting Guide](TROUBLESHOOTING.md) |
| 💻 **Внести изменения** | [Contributing Guide](CONTRIBUTING.md) |
| 📋 **Узнать что нового** | [Changelog](CHANGELOG.md) |
| 🗺️ **Посмотреть планы** | [Roadmap](docs/research/alkoleft_todo.md) |

**Дополнительные ресурсы:**
- 📚 [Полный индекс документации](docs/README.md)
- 🧭 [Roadmap / TODO](docs/research/alkoleft_todo.md) · [Constitution](docs/research/constitution.md)
- 🔁 [Runbooks & DR](docs/runbooks/dr_rehearsal_plan.md) · [On-call](docs/process/oncall_rotations.md)
- ✅ [Changelog](CHANGELOG.md) · [Recent commits](https://github.com/DmitrL-dev/1cai/commits/main)

---

## 🚀 Быстрый старт

### Предварительные требования

- ✅ Python 3.11+ ([установка](docs/setup/python_311.md))
- ✅ Docker Desktop ([скачать](https://www.docker.com/products/docker-desktop))
- ✅ Docker Compose v2.20+
- ✅ 8GB RAM минимум (16GB рекомендуется)
- ✅ 20GB свободного места

**Проверка окружения:**
```bash
make check-runtime  # Проверяет Python версию
docker --version     # Проверяет Docker
docker compose version  # Проверяет Docker Compose
```

### Установка за 5 минут

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/DmitrL-dev/1cai.git
cd 1cai

# 2. Запустите инфраструктуру (PostgreSQL, Redis, Neo4j, Qdrant)
make docker-up
# ⏱️ Займет ~2-3 минуты при первом запуске

# 3. Примените миграции базы данных
make migrate

# 4. Запустите основные сервисы
make servers        # Graph API + MCP Server
make bsl-ls-up      # bsl-language-server (опционально)

# 5. Проверьте, что все работает
make smoke-tests    # Быстрая проверка здоровья сервисов
```

**Готово!** 🎉

- 📡 **API:** http://localhost:8000/docs
- 🔌 **MCP Server:** http://localhost:6001/mcp
- 📊 **Grafana:** http://localhost:3000 (если запущен `make observability-up`)

> 💡 **На Windows:** Используйте аналогичные скрипты из `scripts/windows/` или WSL2 для лучшей совместимости.

[📚 Подробная инструкция →](docs/01-getting-started/START_HERE.md) | 
[🐛 Проблемы? →](TROUBLESHOOTING.md)

### Облако и GitOps

Для production деплоя:

```bash
make gitops-apply          # Применить Argo CD манифесты (1cai-stack, observability, linkerd)
make vault-csi-apply       # Настроить Vault + CSI
make linkerd-install       # Установить сервис-меш
make linkerd-rotate-certs  # Ротация сертификатов
make finops-slack          # Разовая отправка FinOps отчётов (Slack/Teams)
```

Подробный план: [`docs/ops/devops_platform.md`](docs/ops/devops_platform.md), [`docs/ops/gitops.md`](docs/ops/gitops.md)

---

## 🌟 Основные компоненты

| Компонент | Статус | Описание | Документация |
|-----------|--------|----------|--------------|
| 🟢 **MCP Server** | Production | AI-интеграция для Cursor/VS Code, поиск метаданных, генерация кода | [MCP Guide](docs/06-features/MCP_SERVER_GUIDE.md) |
| 🟡 **bsl-language-server** | Beta | AST-парсинг BSL кода, анализ структуры, fallback на regex | [AST Guide](docs/06-features/AST_TOOLING_BSL_LANGUAGE_SERVER.md) |
| 🟢 **EDT Parser** | Production | Парсинг XML-экспортов конфигураций, граф зависимостей | [Parser Guide](docs/06-features/EDT_PARSER_GUIDE.md) |
| 🟡 **ML Dataset Generator** | Alpha | Генерация обучающих датасетов для ML моделей | [ML Guide](docs/06-features/ML_DATASET_GENERATOR_GUIDE.md) |
| 🟢 **CI/CD Pipeline** | Production | GitHub Actions, Argo CD, автоматизация деплоя | [Deployment](docs/04-deployment/PRODUCTION_DEPLOYMENT.md) |
| 🟢 **Observability Stack** | Production | Prometheus, Grafana, Loki, Tempo, SLO мониторинг | [Observability](docs/observability/SLO.md) |
| 🟢 **Security** | Production | Policy-as-code, secret scanning, vulnerability checks | [Security](docs/security/policy_as_code.md) |

**Легенда:** 🟢 Production Ready | 🟡 Beta / In Progress | 🔴 Alpha / Experimental | ⚪ Planned

---

## 💡 Примеры использования

### Пример 1: Быстрый анализ новой конфигурации

**Задача:** Проанализировать конфигурацию 1C и создать документацию

**До (ручной способ):**
```bash
# 1. Открыть EDT
# 2. Изучить структуру объектов (2-3 часа)
# 3. Найти зависимости вручную (1-2 часа)
# 4. Создать документацию (1-2 часа)
# Итого: 4-7 часов работы
```

**После (с 1C AI Stack):**
```bash
# 1. Экспорт конфигурации в XML
# 2. Запуск парсера
make docker-up
make migrate
make generate-docs

# Результат: полный анализ + документация за 5 минут
```

**Результат:** Экономия 4-6 часов на каждую конфигурацию

---

### Пример 2: Интеграция с CI/CD

**Задача:** Автоматизировать деплой в Kubernetes

**Решение:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy via GitOps
        run: make gitops-apply
      - name: Verify deployment
        run: make smoke-tests
```

**Результат:** Автоматический деплой при каждом коммите в main

---

### Пример 3: AI-ассистент для разработки

**Задача:** Найти все места, где используется определенный объект

**Решение:**
1. Открыть Cursor/VS Code
2. Подключиться к MCP Server (`http://localhost:6001/mcp`)
3. Использовать команду: "Найди все использования объекта Справочник.Номенклатура"
4. Получить список всех мест использования с контекстом

**Результат:** Поиск за секунды вместо минут ручного поиска

[📚 Больше примеров →](docs/CASE_STUDIES.md)

---

## 🤖 AI Tooling & Automation
- **bsl-language-server**: сервис AST, make-таргеты `bsl-ls-*`, health-check, fallback в `BSLASTParser`.
  - План интеграции: [`docs/research/bsl_language_server_plan.md`](docs/research/bsl_language_server_plan.md).
  - Детальный гайд: [`docs/06-features/AST_TOOLING_BSL_LANGUAGE_SERVER.md`](docs/06-features/AST_TOOLING_BSL_LANGUAGE_SERVER.md).
- **Spec-driven development** (по мотивам [github/spec-kit](https://github.com/github/spec-kit)):
  - Анализ и предложения: [`docs/research/spec_kit_analysis.md`](docs/research/spec_kit_analysis.md).
  - Конституция правил проверки: [`docs/research/constitution.md`](docs/research/constitution.md).
  - Шаблоны и CLI: `templates/`, `scripts/research/init_feature.py`, make-таргеты `feature-init` и `feature-validate`.
- **MCP инструменты**: поиск метаданных, генерация кода, запуск тестов.
- **Automation scripts**: `scripts/context/export_platform_context.py`, `scripts/context/generate_docs.py`, `scripts/docs/create_adr.py`.
- **Monitoring automation**: `scripts/monitoring/github_monitor.py` + workflow `github-monitor.yml` — ежедневный snapshot зависимостей.
- **Release automation**: `scripts/release/create_release.py`, make `release-*`, workflow `release.yml` — генерация заметок, тегов, публикация релизов.
- **Quality metrics**: `scripts/metrics/collect_dora.py`, workflow `dora-metrics.yml` — еженедельные DORA-показатели.

---

## 🏛 Architecture & Documentation
- **High-Level Design**: [`docs/architecture/01-high-level-design.md`](docs/architecture/01-high-level-design.md)
- **Structurizr DSL**: [`docs/architecture/c4/workspace.dsl`](docs/architecture/c4/workspace.dsl)
- **Диаграммы (PNG)**: `docs/architecture/uml/**` (C4, data, dynamics, operations, security)
- **ADR**: `docs/architecture/adr/`, см. `ADR-0001… ADR-0005`
- **Automated render**: `make render-uml`, workflow `.github/workflows/uml-render-check.yml`

---

## ✅ Testing & Quality
- **YAxUnit + EDT runner** (в планах расширения через репозитории BIA: yaxunit, edt-test-runner).
- `make test-bsl` (см. `scripts/tests/run_bsl_tests.py`).
- Статический анализ, best practices, проверка зависимостей.
- Сторожевые скрипты: `scripts/audit/*`, `scripts/analysis/*`.
- Справочник по тестам: [`docs/06-features/TESTING_GUIDE.md`](docs/06-features/TESTING_GUIDE.md).
- Smoke проверки: `make smoke-tests`, CI job `smoke-tests`, артефакты pytest (`output/test-results`).
- Наблюдаемость: `/metrics` (Prometheus), SLO/Runbooks (`docs/observability/SLO.md`, `docs/runbooks/alert_slo_runbook.md`), автоматические отчёты DORA.
- **Secret scanning & Security**
  - Workflows `secret-scan.yml` (Gitleaks) и `trufflehog.yml` (Trufflehog) — регулярное сканирование репозитория на утечки токенов.
  - Policy-as-code: `policy/` (Rego) + `scripts/security/run_policy_checks.sh` (Conftest Kubernetes + Terraform, Semgrep, Checkov/Trivy) → `make policy-check` / CI стадии.
  - Infrastructure scanners: `scripts/security/run_checkov.sh` (Checkov + Trivy) подключён в Jenkins/GitLab/Azure pipeline.
  - GitOps: `infrastructure/argocd/`, `scripts/gitops/*.sh`, make `gitops-apply`, `gitops-sync`.
  - Cloud readiness: `infrastructure/terraform/aws-eks/`, `infrastructure/terraform/azure-aks/`, Ansible bootstrap (`infrastructure/ansible/`).
  - Secrets: `scripts/secrets/aws_sync_to_vault.py`, `scripts/secrets/azure_sync_to_vault.py`, `scripts/secrets/apply_vault_csi.sh`.
  - Self-control: `scripts/checklists/preflight.sh`, make `preflight`.
- **FinOps**
  - Скрипты `scripts/finops/aws_cost_*`, `scripts/finops/azure_cost_to_slack.py`, `scripts/finops/aws_budget_check.py`, `scripts/finops/azure_budget_check.py`, `scripts/finops/teams_notify.py` — отчёты, бюджеты и Slack/Teams уведомления; дашборд `observability/grafana/dashboards/finops_cost.json`.
  - Workflow `.github/workflows/finops-report.yml` — ежедневный отчёт.
  - DR rehearsal: `docs/runbooks/dr_rehearsal_plan.md`, script `scripts/runbooks/dr_rehearsal_runner.py`, workflow `dr-rehearsal.yml`.

---

## 🔗 Integrations
- **IDE**: MCP сервер (Cursor/VS Code), EDT плагин (`edt-plugin/`).
- **Внешние инструменты**: alkoleft платформенные сервисы, yaxunit, GitHub Spec Kit (в работе).
- **ITS Scraper**: асинхронный сбор статей, версионирование (`integrations/its_scraper`).
- **Telegram / n8n / OCR**: дополнительные модули в `src/` и `integrations/`.

---

## 📚 Documentation Hub

Полный индекс: [`docs/README.md`](docs/README.md). Ключевые разделы:
- **Setup & Runtime**
  - [`docs/setup/python_311.md`](docs/setup/python_311.md) — установка Python 3.11 и проверка среды.
  - `scripts/setup/check_runtime.py` + `make check-runtime` — автоматическая проверка версии Python.
- **Infrastructure & DevOps**
  - [`docs/ops/devops_platform.md`](docs/ops/devops_platform.md) — стратегия DevOps-платформы.
  - [`docs/ops/gitops.md`](docs/ops/gitops.md) — GitOps с Argo CD.
  - [`docs/ops/ansible.md`](docs/ops/ansible.md) — bootstrap инфраструктуры Ansible.
  - [`docs/ops/service_mesh.md`](docs/ops/service_mesh.md) — Istio blueprint.
  - [`infrastructure/service-mesh/linkerd`](infrastructure/service-mesh/linkerd) — альтернативный service mesh.
  - [`docs/ops/chaos_engineering.md`](docs/ops/chaos_engineering.md) — Litmus chaos сценарии.
  - [`docs/ops/vault.md`](docs/ops/vault.md) — Vault & secret management.
  - [`docs/ops/azure_devops.md`](docs/ops/azure_devops.md) — Azure DevOps pipeline.
  - [`docs/ops/finops.md`](docs/ops/finops.md) — FinOps и контроль затрат (`make finops-slack`, workflow `finops-report.yml`).
  - [`docs/ops/self_control.md`](docs/ops/self_control.md) — самоконтроль инженера (`make preflight`).
  - `infrastructure/kind/cluster.yaml` — локальный Kubernetes.
  - `infrastructure/helm/1cai-stack` — Helm chart приложения.
  - `infrastructure/helm/observability-stack` — Prometheus/Loki/Tempo/Grafana/OTEL.
  - `infrastructure/service-mesh/istio` — IstioOperator профиль.
  - `infrastructure/chaos/litmus` — Litmus Chaos эксперименты.
  - `infrastructure/argocd/` — manifests для Argo CD (GitOps, Linkerd ApplicationSet).
  - `infrastructure/terraform` — Terraform конфигурация для Helm релиза.
  - `infrastructure/terraform/aws-eks` — Terraform модуль EKS (AWS).
  - `infrastructure/terraform/azure-aks` — Terraform модуль AKS (Azure).
  - `infrastructure/terraform/azure-keyvault` — Terraform модуль Key Vault.
  - `scripts/service_mesh/linkerd/bootstrap_certs.sh` — генерация trust anchors/issuer.
  - `scripts/service_mesh/linkerd/` — bootstrap/rotate certs, managed identity, CI smoke (`linkerd-smoke.yml`).
  - Make: `linkerd-install`, `linkerd-rotate-certs`, `linkerd-smoke`.
  - `infrastructure/azure/azure-pipelines.yml` — Azure DevOps pipeline.
  - `infrastructure/vault/` — политики, скрипты, SecretProviderClass для Vault (`make vault-csi-apply`, sync скрипты).
  - `scripts/secrets/aws_sync_to_vault.py` — синхронизация AWS Secrets Manager → Vault.
  - `infrastructure/jenkins/Jenkinsfile`, `infrastructure/gitlab/.gitlab-ci.yml` — многостадийные pipeline.
  - [`docs/security/policy_as_code.md`](docs/security/policy_as_code.md) — Rego-политики, Conftest, Semgrep.
- **Feature Guides**
  - [`docs/06-features/AST_TOOLING_BSL_LANGUAGE_SERVER.md`](docs/06-features/AST_TOOLING_BSL_LANGUAGE_SERVER.md) — запуск и диагностика bsl-language-server, fallback сценарии.
  - [`docs/06-features/MCP_SERVER_GUIDE.md`](docs/06-features/MCP_SERVER_GUIDE.md) — эндпоинты MCP, переменные окружения, troubleshooting.
  - [`docs/06-features/TESTING_GUIDE.md`](docs/06-features/TESTING_GUIDE.md) — матрица тестов, команды pytest/k6, CI-джобы.
  - [`docs/06-features/EDT_PARSER_GUIDE.md`](docs/06-features/EDT_PARSER_GUIDE.md) — разбор EDT XML, метрики и сценарии анализа.
  - [`docs/06-features/ML_DATASET_GENERATOR_GUIDE.md`](docs/06-features/ML_DATASET_GENERATOR_GUIDE.md) — подготовка ML датасетов и пайплайн обучения.
- **Operations & Tooling**
  - [`docs/scripts/README.md`](docs/scripts/README.md) — карта CLI/скриптов, spec-driven workflow, Windows альтернативы, release tooling.
- **Observability**
  - [`docs/observability/SLO.md`](docs/observability/SLO.md) — целевые показатели доступности и латентности.
  - [`docs/runbooks/alert_slo_runbook.md`](docs/runbooks/alert_slo_runbook.md) — действия при нарушении SLO.
  - [`docs/status/dora_history.md`](docs/status/dora_history.md) — автоматическая история DORA метрик (weekly).
  - Workflow `observability.yml` — напоминание об интеграции SLO/метрик.
  - `make observability-up` → локальный Prometheus/Grafana/Alertmanager стек (см. `observability/docker-compose.observability.yml`), проверяется CI (`observability-test.yml`).
  - `make helm-observability` → установка Kubernetes-стека наблюдаемости (Prometheus + Loki + Tempo + Grafana + OTEL) из `infrastructure/helm/observability-stack`.
  - Alertmanager конфигурация: `observability/alertmanager.yml` + правила `observability/alerts.yml` (Telegram; требуются `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).
  - Telegram оповещения: workflow `telegram-alert.yaml` (требует `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).
- **Architecture**
  - [`docs/architecture/README.md`](docs/architecture/README.md) — обзор C4, операции и ссылки на ADR.
  - [`docs/architecture/adr/`](docs/architecture/adr/) — реестр решений, статусы и история изменений.
  - [`docs/architecture/uml/`](docs/architecture/uml/) — PlantUML диаграммы (структура, потоки, безопасность).
- **Parsers & Documentation**
  - [`docs/06-features/EDT_PARSER_GUIDE.md`](docs/06-features/EDT_PARSER_GUIDE.md) — парсинг конфигураций, метаданные.
  - [`docs/06-features/ML_DATASET_GENERATOR_GUIDE.md`](docs/06-features/ML_DATASET_GENERATOR_GUIDE.md) — генерация обучающих наборов.
  - [`docs/06-features/ITS_SCRAPER.md`](docs/03-integrations/ITS_SCRAPER.md) — сбор данных ITS и обновление базы знаний.
- **Research & Plans**
  - [`docs/research/README_LOCAL.md`](docs/research/README_LOCAL.md) — ежедневные статусы и подготовка публикации.
  - [`docs/research/alkoleft_todo.md`](docs/research/alkoleft_todo.md) — roadmap и планы развития.
  - [`docs/research/constitution.md`](docs/research/constitution.md) — конституция правил проверки.

---

## ❓ Часто задаваемые вопросы

<details>
<summary><b>Нужен ли Docker для работы?</b></summary>

Да, Docker требуется для запуска инфраструктуры (PostgreSQL, Redis, Neo4j, Qdrant). 
Для локальной разработки можно использовать:
- Docker Desktop (Windows/Mac)
- Docker Engine (Linux)
- WSL2 с Docker (Windows)

[Подробнее о настройке Docker →](docs/01-getting-started/quickstart.md#docker-setup)
</details>

<details>
<summary><b>Какой Python нужен?</b></summary>

Python 3.11 или выше. Проверка версии:
```bash
python --version  # Должно быть 3.11+
make check-runtime  # Автоматическая проверка
```

[Подробнее о настройке Python →](docs/setup/python_311.md)
</details>

<details>
<summary><b>Можно ли использовать без Kubernetes?</b></summary>

Да! Для локальной разработки Kubernetes не требуется. Используйте Docker Compose:
```bash
make docker-up  # Запускает все через docker-compose
```

Kubernetes нужен только для production деплоя.

[Подробнее →](docs/04-deployment/PRODUCTION_DEPLOYMENT.md)
</details>

<details>
<summary><b>Как интегрировать с моим проектом?</b></summary>

1. Клонируйте репозиторий
2. Настройте `.env` файл
3. Запустите `make docker-up`
4. Используйте API или MCP Server

[Подробная инструкция →](docs/01-getting-started/START_HERE.md)
</details>

<details>
<summary><b>Есть ли поддержка Windows?</b></summary>

Да! Проект полностью поддерживает Windows:
- Docker Desktop для Windows
- PowerShell скрипты в `scripts/windows/`
- WSL2 для лучшей совместимости

[Windows инструкции →](docs/01-getting-started/quickstart.md#windows)
</details>

<details>
<summary><b>Как работает MCP Server?</b></summary>

MCP Server предоставляет AI-интеграцию для Cursor/VS Code. Он позволяет:
- Искать метаданные конфигураций
- Генерировать код на основе контекста
- Запускать тесты
- Анализировать зависимости

[Подробный гайд →](docs/06-features/MCP_SERVER_GUIDE.md)
</details>

[📋 Все вопросы →](FAQ.md) | 
[💬 Задать вопрос →](https://github.com/DmitrL-dev/1cai/discussions)

---

## 📖 О проекте

**1C AI Stack** родился из необходимости автоматизировать рутинные задачи при работе с 1C:Enterprise. 
Вместо того чтобы тратить часы на анализ конфигураций и генерацию документации, мы создали платформу, 
которая делает это автоматически с помощью AI и современных DevOps практик.

### Наша миссия

Сделать разработку на 1C такой же современной и эффективной, как разработка на любом другом стеке.

### Ключевые принципы

- 🔓 **Open Source** — код открыт для всех
- 🛡️ **Security First** — безопасность превыше всего
- 📚 **Документация как код** — документация версионируется вместе с кодом
- 🤝 **Сообщество превыше всего** — мы слушаем пользователей
- ⚡ **Автоматизация** — автоматизируем все, что можно

### История версий

- **v5.1** (текущая) — Production ready, полная документация
- **v5.0** — Добавлен MCP Server, bsl-language-server интеграция
- **v4.0** — CI/CD pipeline, observability stack
- **v3.0** — EDT Parser, ML Dataset Generator

[📋 Полная история →](CHANGELOG.md)

---

## 💬 Поддержка и сообщество

### Получить помощь

- 🐛 **Сообщить о баге:** [Создать issue](https://github.com/DmitrL-dev/1cai/issues/new)
- 💡 **Предложить фичу:** [Создать discussion](https://github.com/DmitrL-dev/1cai/discussions/new?category=ideas)
- ❓ **Задать вопрос:** [Discussions](https://github.com/DmitrL-dev/1cai/discussions)
- 📖 **Документация:** [Полный индекс](docs/README.md)

### Внести вклад

Мы приветствуем вклад от сообщества! См. [Contributing Guide](CONTRIBUTING.md) для деталей.

**Быстрый старт для контрибьюторов:**
1. Fork репозиторий
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'feat: add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

---

## 📄 Лицензия

Этот проект лицензирован под MIT License — см. [LICENSE](LICENSE) для деталей.

---

## 🙏 Благодарности

- [1C:Enterprise](https://1c.ru/) — за платформу
- [bsl-language-server](https://github.com/1c-syntax/bsl-language-server) — за AST парсинг
- Всем контрибьюторам проекта

---

**Сделано с ❤️ для сообщества 1C разработчиков**