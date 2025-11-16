# ⚙️ AI Performance & Observability Guide

**Фокус:** Orchestrator + Kimi-K2-Thinking + Qwen Coder  
**Цель:** понимать, как мерить производительность и где смотреть, если «AI медленный».

---

## 1. Какие метрики уже есть

Реализация в `src/monitoring/prometheus_metrics.py`, обзор — в `monitoring/AI_SERVICES_MONITORING.md`.

- **Orchestrator**
  - `orchestrator_queries_total{query_type,selected_service}`
  - `orchestrator_cache_hits_total`, `orchestrator_cache_misses_total`
  - `orchestrator_fallback_total{from_service,to_service,reason}`
- **Kimi‑K2‑Thinking**
  - `kimi_queries_total{mode,status}`
  - `kimi_response_duration_seconds_bucket{mode}` (гистограмма)
  - `kimi_tokens_used_total{mode,token_type}`
- **Общие AI метрики**
  - `ai_queries_total{agent_type,status,model}`
  - `ai_response_duration_seconds_bucket{agent_type,model}`
  - `ai_errors_total{service,model,error_type}`

Эти метрики уже используются в Grafana‑дашборде `monitoring/grafana/dashboards/ai_services.json`.

---

## 2. Минимальный synthetic‑тест производительности

Для локальной проверки базовой работы кеша и оркестратора:

```bash
python -m pytest tests/unit/test_ai_orchestrator_basic.py -q
```

Тест `test_process_query_uses_cache_on_second_call`:

- вызывает `AIOrchestrator.process_query` дважды с одинаковыми аргументами;
- проверяет, что:
  - ответ берётся из `orchestrator.cache`,
  - счётчик `orchestrator_cache_hits_total` увеличился.

Тест `test_process_query_unknown_uses_multi_service_stub` дополнительно проверяет увеличение `orchestrator_cache_misses_total`.

---

## 3. Kimi-K2-Thinking benchmark script

Для точечного замера латентности Kimi используется скрипт `scripts/testing/kimi_benchmark.py`:

```bash
python scripts/testing/kimi_benchmark.py --requests 10 --concurrency 2
```

Он:

- использует тот же `KimiClient/KimiConfig`, что и оркестратор;
- выполняет N запросов с заданной конкуррентностью;
- печатает min/avg/p50/p95/max latency и распределение ошибок.

Если `KIMI_API_KEY` / `KIMI_OLLAMA_URL` не заданы, скрипт аккуратно сообщает, что бенчмарк пропущен.

---

---

## 4. Orchestrator latency smoke-тест (offline)

Для быстрой проверки латентности Orchestrator в offline‑режиме (без Kimi/Qwen) есть скрипт `scripts/testing/orchestrator_latency_smoke.py`:

```bash
python scripts/testing/orchestrator_latency_smoke.py --requests 10
```

Он:

- несколько раз вызывает `AIOrchestrator.process_query` с отключёнными внешними клиентами,
- выводит время обработки каждого запроса и среднее значение.

Скрипт не делает жёстких assert'ов, а служит как быстрая ручная проверка и источник чисел для сравнения между ветками/коммитами.

---

## 5. Как смотреть latency и cache hit rate в Prometheus

Примеры промкьюэл‑запросов (также приведены в `monitoring/AI_SERVICES_MONITORING.md`):

```promql
# Cache hit rate оркестратора
rate(orchestrator_cache_hits_total[5m])
/
(rate(orchestrator_cache_hits_total[5m]) + rate(orchestrator_cache_misses_total[5m]))
* 100

# Среднее время ответа Kimi (p50)
histogram_quantile(
  0.50,
  rate(kimi_response_duration_seconds_bucket[5m])
)

# Среднее время ответа AI агентов (p95)
histogram_quantile(
  0.95,
  rate(ai_response_duration_seconds_bucket[5m])
)
```

Рекомендуемые целевые ориентиры:

- cache hit rate оркестратора: **≥ 60–70%** для повторяющихся запросов;
- p95 latency для Kimi/Qwen: в пределах **≤ 60s** под нагрузкой (см. alert‑правила).

---

## 6. Быстрая диагностика «AI тормозит»

1. **Проверить `/metrics`**  
   Убедиться, что endpoint жив и метрики отдаются (см. `metrics_endpoint` в `prometheus_metrics.py`).

2. **Открыть Grafana AI Services Dashboard**  
   - панели `Kimi Response Duration`, `AIHighResponseTime`, `Orchestrator Fallbacks`.

3. **Смотреть на:**
   - всплески `kimi_response_duration_seconds` или `ai_response_duration_seconds`,
   - рост `orchestrator_fallback_total` (переходы Kimi→Qwen и т.п.),
   - падение cache hit rate.

4. **Локально прогнать smoke‑тесты:**

```bash
python -m pytest tests/system/test_e2e_ba_dev_qa.py tests/system/test_e2e_flows.py -q
```

Если e2e проходят нормально, а latency высока только в прод‑кластерe — проблема, скорее всего, в окружении/сетях, а не в коде агентов.

---

## 7. Что наращивать дальше

- Добавить k6/Locust‑сценарии для Orchestrator (нагрузка на `/api/ai/query` с разными типами запросов).  
- Ввести перцентильные SLO для AI ответов (например, `p95 <= 60s` для Kimi и `p95 <= 15s` для Qwen) и подключить к существующей системе SLO/Alertmanager.


