# Как внедрить наши стандарты (Scenario DSL, Autonomy Policy, Unified Change Graph)

> Цель: дать внешней системе (оркестратору, IDE, GitOps‑платформе или CodeAlive‑подобному
> продукту) минимальный и проверяемый путь интеграции с нашими стандартами, без
> необходимости переносить весь код стека.

---

## 1. Scenario DSL

- Базовая спецификация: `docs/architecture/SCENARIO_DSL_SPEC.md`  
- JSON Schema: `docs/architecture/SCENARIO_DSL_SCHEMA.json`

Минимальный путь внедрения:

1. Хранить сценарии в формате `ScenarioPlan` (YAML/JSON) по схеме из DSL:
   - `goal` (id/title/description/constraints/success_criteria);
   - `steps` (id/title/description/risk_level/autonomy_required/checks/executor/metadata);
   - `required_autonomy`, `overall_risk`, `context`, `version`, `spec`.
2. Валидировать сценарии по JSON Schema в своём CI.
3. Отдавать сценарии через собственный API (например, `/api/scenarios/*`) в этом же формате,
   чтобы любые клиенты могли работать с ними без привязки к конкретной реализации.

---

## 2. Autonomy & Policy Model

- Спека: `docs/architecture/AUTONOMY_POLICY_SPEC.md`  
- JSON Schema конфигурации: `docs/architecture/AUTONOMY_POLICY_SCHEMA.json`

Минимальный путь внедрения:

1. Поддержать стандартные уровни:
   - `AutonomyLevel`: `A0_propose_only`, `A1_safe_automation`, `A2_non_prod_changes`, `A3_restricted_prod`;
   - `ScenarioRiskLevel`: `read_only`, `non_prod_change`, `prod_low`, `prod_high`.
2. Хранить конфигурацию политики в JSON‑формате, совместимом со схемой
   `AUTONOMY_POLICY_SCHEMA.json` (mapping `autonomy -> {max_auto_risk, max_allowed_risk}`).
3. Реализовать у себя алгоритм принятия решения по шагу (AUTO / NEEDS_APPROVAL / FORBIDDEN)
   по аналогии с `decide_step_execution`/`assess_plan_execution`.
   - Для локальных экспериментов можно ориентироваться на CLI пример
     `scripts/cli/print_scenario_decisions.py`, который читает ScenarioPlan (JSON/YAML)
     и печатает решения политики в JSON.

Так ваша система сможет:

- интерпретировать ScenarioPlan’ы с нашими уровнями риска/автономии;
- обеспечивать совместимое поведение с нашим Orchestrator/Scenario Hub.

---

## 3. Unified Change Graph

- Спека: `docs/architecture/CODE_GRAPH_REFERENCE.md`  
- Базовая реализация интерфейса: `src/ai/code_graph.py`

Минимальный путь внедрения:

1. Поддержать минимальный набор типов узлов/связей (`NodeKind`, `EdgeKind`), либо
   завести свои типы с сохранением базовой семантики (service/module/file/test_case/alert и т.п.).
2. Реализовать интерфейс `CodeGraphBackend` (или его аналог) с операциями:
   `upsert_node`, `upsert_edge`, `get_node`, `neighbors`, `find_nodes`.
3. Использовать `graph_refs` из `ScenarioPlan.metadata` для привязки сценариев к узлам графа.

Это позволяет:

- делать impact‑анализ сценариев (какие сервисы/тесты/alerts затрагиваются);
- строить общие отчёты и визуализации поверх разных реализаций графа.

---

## 4. Рекомендуемый порядок интеграции

1. **Scenario DSL**: внедрить формат планов и их валидацию по JSON Schema.  
2. **Autonomy Policy**: согласовать уровни риска/автономии и внедрить совместимый алгоритм принятия решений.  
3. **Unified Change Graph**: привязать сценарии к своим узлам графа через `graph_refs`.  

Даже реализовав только первые два шага, любая система сможет:

- обмениваться сценариями с нашим стеком;
- интерпретировать уровни риска/автономии одинаково;
- использовать единый язык описания сценариев в разных продуктах.

Для формальной самопроверки см. также чеклист соответствия:
`docs/architecture/STANDARDS_CONFORMANCE_CHECKLIST.md`.


