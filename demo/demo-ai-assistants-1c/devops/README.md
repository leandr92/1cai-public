# DevOps Best Practices и Автоматизация - AI Ассистенты

## 📋 Обзор

Данный раздел содержит комплексную систему DevOps best practices для проекта AI ассистентов, включающую автоматизацию инфраструктуры, безопасности, мониторинга и управления инцидентами.

## 🏗️ Структура проекта

```
devops/
├── iac/                          # Infrastructure as Code
│   ├── terraform/
│   │   ├── aws/                  # AWS Terraform конфигурации
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   └── gcp/                  # GCP Terraform конфигурации
│   ├── kubernetes/
│   │   ├── namespaces/           # Kubernetes namespaces
│   │   ├── deployments/          # Deployment манифесты
│   │   ├── services/             # Service манифесты
│   │   ├── ingress/              # Ingress конфигурации
│   │   ├── configmaps/           # ConfigMaps
│   │   ├── secrets/              # Secrets
│   │   └── RBAC/                 # Role-based access control
│   └── helm/
│       └── ai-assistants/        # Helm chart для приложения
│           ├── Chart.yaml
│           ├── values.yaml
│           └── templates/
│
├── security/                     # DevSecOps
│   ├── sast/                     # Static Application Security Testing
│   │   ├── .semgrep.yml          # Semgrep правила
│   │   └── sonar-project.properties
│   ├── dast/                     # Dynamic Application Security Testing
│   │   ├── docker-compose.yml    # OWASP ZAP конфигурация
│   │   └── zap-baseline.py
│   ├── vulnerability-scanning/   # Сканирование уязвимостей
│   │   ├── trivy-config.yml
│   │   └── dependabot.yml
│   ├── container-security/       # Безопасность контейнеров
│   │   ├── dockerfile.lint
│   │   └── trivy-image-scan.sh
│   ├── compliance/               # Compliance as Code
│   │   ├── cis-benchmarks.yaml
│   │   └── cloud-custodian/
│   └── policies/                 # Политики безопасности
│       ├── pod-security-policy.yaml
│       └── network-policies.yaml
│
├── performance/                  # Performance Engineering
│   ├── load-testing/             # Нагрузочное тестирование
│   │   ├── load-test.js          # K6 тест
│   │   └── jmeter-plan.jmx       # JMeter план
│   ├── performance-baselines/    # Базовые показатели
│   │   ├── baseline-metrics.yml
│   │   └── performance-test.yml
│   ├── resource-optimization/    # Оптимизация ресурсов
│   │   ├── vpa.yaml
│   │   └── hpa.yaml
│   ├── auto-scaling/             # Автомасштабирование
│   │   ├── cluster-autoscaler.yaml
│   │   └── horizontal-pod-autoscaler.yaml
│   └── capacity-planning/        # Планирование мощности
│       ├── capacity-calculator.py
│       └── forecasting.md
│
├── incident-response/            # Управление инцидентами
│   ├── runbooks/                 # Пошаговые инструкции
│   │   ├── database-connection-issues.md
│   │   ├── high-memory-usage.md
│   │   ├── pod-crash-loops.md
│   │   └── service-down.md
│   ├── detection/                # Автоматическое обнаружение
│   │   ├── prometheus-rules.yml
│   │   └── alertmanager.yml
│   ├── on-call/                  # Управление дежурствами
│   │   ├── rotation-schedule.md
│   │   └── escalation-policy.md
│   ├── post-mortems/             # Анализ инцидентов
│   │   ├── template.md
│   │   └── example-incident.md
│   └── knowledge-base/           # База знаний
│       ├── troubleshooting-guide.md
│       └── common-issues.md
│
├── automation/                   # Автоматизация
│   ├── deployment/               # Скрипты развертывания
│   │   ├── deploy.sh             # Основной скрипт деплоя
│   │   ├── rollback.sh           # Откат развертывания
│   │   └── validate-deployment.sh
│   ├── monitoring/               # Скрипты мониторинга
│   │   ├── health-check.sh
│   │   ├── performance-monitor.sh
│   │   └── security-scan.sh
│   ├── backup/                   # Резервное копирование
│   │   ├── create-backup.sh
│   │   ├── restore-backup.sh
│   │   └── backup-schedule.yml
│   ├── scaling/                  # Масштабирование
│   │   ├── scale-up.sh
│   │   └── scale-down.sh
│   └── security/                 # Безопасность
│       ├── rotate-secrets.sh
│       ├── certificate-renewal.sh
│       └── security-audit.sh
│
├── monitoring/                   # Мониторинг и алертинг
│   ├── prometheus/
│   │   ├── prometheus.yml        # Основная конфигурация
│   │   ├── alert_rules.yml       # Правила алертов
│   │   └── recording_rules.yml   # Правила агрегирования
│   ├── grafana/                  # Дашборды
│   │   ├── dashboard-configs/
│   │   └── datasource.yml
│   └── alertmanager/             # Управление алертами
│       ├── alertmanager.yml
│       └── templates/
│
└── ci-cd/                        # CI/CD Pipeline
    ├── github-actions.yml        # GitHub Actions workflow
    ├── jenkins-pipeline.yml      # Jenkins pipeline
    └── gitlab-ci.yml             # GitLab CI/CD
```

## 🚀 Быстрый старт

### 1. Настройка окружения

```bash
# Установка необходимых инструментов
brew install terraform kubectl helm

# Настройка доступа к AWS
aws configure

# Настройка доступа к Kubernetes
aws eks update-kubeconfig --region us-west-2 --name ai-assistants
```

### 2. Инициализация инфраструктуры

```bash
# Переход в директорию Terraform
cd devops/iac/terraform/aws

# Инициализация
terraform init

# Планирование изменений
terraform plan

# Применение конфигурации
terraform apply
```

### 3. Развертывание приложения

```bash
# Базовое развертывание
./devops/automation/deployment/deploy.sh --env staging --version v1.0.0

# Развертывание с дополнительными опциями
./devops/automation/deployment/deploy.sh \
  --env production \
  --version v1.2.3 \
  --skip-tests \
  --dry-run
```

## 🛡️ Безопасность

### Автоматическое сканирование безопасности

```bash
# SAST с Semgrep
semgrep --config=devops/security/sast/.semgrep.yml src/

# DAST с OWASP ZAP
docker-compose -f devops/security/dast/docker-compose.yml up

# Сканирование контейнеров с Trivy
trivy image ai-assistants/api:latest

# Проверка зависимостей
npm audit --audit-level=high
```

### Compliance проверки

```bash
# Проверка Kubernetes по стандартам CIS
kube-bench

# Аудит AWS по стандартам CIS
prowler aws -M csv

# Cloud Custodian правила
custodian run -s output/ devops/security/compliance/policies.yml
```

## 📊 Мониторинг

### Доступ к Grafana

```bash
# Порт-форвардинг для доступа к Grafana
kubectl port-forward svc/grafana 3000:3000 -n monitoring

# Открыть в браузере: http://localhost:3000
# Пользователь: admin
# Пароль: admin (изменить в продакшене!)
```

### Ключевые дашборды

- **Infrastructure Overview**: Общий обзор инфраструктуры
- **Application Metrics**: Метрики приложения
- **Database Performance**: Производительность БД
- **Security Dashboard**: Безопасность и алерты
- **Business Metrics**: Бизнес-метрики

### Настройка алертов

Алерты настраиваются через Prometheus и AlertManager:

```bash
# Проверка алертов
kubectl port-forward svc/alertmanager 9093:9093 -n monitoring
# Открыть: http://localhost:9093
```

## ⚡ Производительность

### Нагрузочное тестирование

```bash
# Установка K6
brew install k6

# Запуск теста
k6 run devops/performance/load-testing/load-test.js \
  --base-url=https://ai-assistants.company.com

# Создание отчета
k6 run devops/performance/load-testing/load-test.js \
  --out json=results.json
```

### Мониторинг производительности

```bash
# Проверка автоскейлинга
kubectl get hpa -n ai-assistants

# Просмотр VPA рекомендаций
kubectl get vpa -n ai-assistants -o yaml

# Анализ производительности БД
psql -h database.company.com -c "
  SELECT query, mean_time, calls 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 10;
"
```

## 🚨 Управление инцидентами

### Дежурная служба

```bash
# Проверка текущего дежурного
cat devops/incident-response/on-call/rotation-schedule.md

# Эскалация инцидента
./scripts/incident/escalate.sh --severity SEV1 --incident-id INC-12345
```

### Обработка инцидента

1. **Обнаружение**: Автоматические алерты
2. **Уведомление**: Slack/PagerDuty/Email
3. **Диагностика**: Использование runbooks
4. **Решение**: Выполнение процедур
5. **Документирование**: Post-mortem

### Быстрые команды

```bash
# Проверка статуса сервисов
kubectl get pods -n ai-assistants

# Проверка логов
kubectl logs -f deployment/ai-assistants-api -n ai-assistants

# Перезапуск сервиса
kubectl rollout restart deployment/ai-assistants-api -n ai-assistants

# Масштабирование
kubectl scale deployment ai-assistants-api --replicas=5 -n ai-assistants
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Pipeline автоматически выполняет:

1. **Code Quality**: Линтинг и форматирование
2. **Security Scanning**: SAST и анализ зависимостей  
3. **Tests**: Unit и интеграционные тесты
4. **Build**: Сборка Docker образа
5. **Container Security**: Сканирование образа
6. **Deploy**: Развертывание в staging/production

### Manual Deployment

```bash
# Развертывание в staging
./devops/automation/deployment/deploy.sh \
  --env staging \
  --version $GITHUB_SHA

# Развертывание в production
./devops/automation/deployment/deploy.sh \
  --env production \
  --version $GITHUB_SHA
```

## 📚 Документация

### Основные документы

- **[DevOps Best Practices](devops-best-practices.md)** - Полное руководство по DevOps
- **[Architecture Overview](../docs/architecture-overview.md)** - Обзор архитектуры
- **[Deployment Guide](../docs/deployment-guide.md)** - Руководство по развертыванию
- **[Monitoring Guide](../docs/monitoring-guide.md)** - Руководство по мониторингу

### Runbooks

- [Database Connection Issues](incident-response/runbooks/database-connection-issues.md)
- [High Memory Usage](incident-response/runbooks/high-memory-usage.md)
- [Pod Crash Loops](incident-response/runbooks/pod-crash-loops.md)
- [Service Down](incident-response/runbooks/service-down.md)

## 🔧 Конфигурация

### Переменные окружения

```bash
# Terraform variables
export TF_VAR_environment=production
export TF_VAR_cluster_name=ai-assistants-prod

# Application variables
export DATABASE_HOST=prod-db.company.com
export REDIS_HOST=prod-redis.company.com
export API_KEY=your-api-key
```

### Secrets Management

```bash
# Создание секретов
kubectl create secret generic ai-assistants-secrets \
  --from-literal=database.password=your-db-password \
  --from-literal=redis.password=your-redis-password \
  --from-literal=ai.api.key=your-ai-api-key \
  -n ai-assistants

# Ротация секретов
./devops/automation/security/rotate-secrets.sh --all
```

## 📈 Метрики и KPI

### Infrastructure KPIs

- **Deployment Frequency**: 1+ раз в день
- **Lead Time for Changes**: < 2 часа
- **Mean Time to Recovery (MTTR)**: < 30 минут
- **Change Failure Rate**: < 5%

### Application KPIs

- **Availability**: 99.9% uptime
- **Response Time**: < 500ms (95th percentile)
- **Error Rate**: < 0.1%
- **Throughput**: > 1000 RPS

## 🆘 Поддержка

### Контакты

- **DevOps Team**: devops@company.com
- **Emergency Hotline**: +7 (495) 123-45-67
- **Slack Channel**: #ai-assistants-devops
- **Documentation**: https://docs.company.com/ai-assistants

### Эскалация

1. **Level 1**: Дежурный DevOps инженер
2. **Level 2**: Senior DevOps Engineer
3. **Level 3**: DevOps Team Lead
4. **Level 4**: CTO/VP Engineering

## 🔗 Полезные ссылки

- [Terraform Documentation](https://terraform.io/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs)
- [Helm Documentation](https://helm.sh/docs)
- [Prometheus Documentation](https://prometheus.io/docs)
- [Grafana Documentation](https://grafana.com/docs)
- [OWASP Security](https://owasp.org)
- [Site Reliability Engineering](https://sre.google)

---

**Последнее обновление**: 2025-11-02  
**Версия**: 1.0.0  
**Автор**: DevOps Team