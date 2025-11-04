# 🏗️ Быстрый старт: AI Архитектор

## Начало работы с AI Архитектором за 5 минут

---

## 🚀 Шаг 1: Установка

```bash
# Уже установлено в проекте!
# Проверьте:
ls src/ai/agents/architect_agent_extended.py
```

✅ Готово!

---

## 🎯 Шаг 2: Первый запуск

### **Вариант A: Примеры (рекомендуется)**

```bash
# Запустить все 6 примеров
python examples/architect_usage_examples.py
```

**Что произойдет:**
- Граф-анализ ERP
- Генерация ADR
- Детекция anti-patterns
- Выбор технологий
- Анализ производительности
- Полный workflow

---

### **Вариант B: Интерактивно (Python)**

```python
from src.ai.agents.architect_agent_extended import ArchitectAgentExtended

# Инициализация
architect = ArchitectAgentExtended()

# Использование
result = await architect.analyze_architecture_graph("ERP")
print(f"Overall Score: {result['metrics']['overall_score']}/10")
```

---

### **Вариант C: MCP Server (для Cursor/VSCode)**

```bash
# Запуск MCP Server
python src/ai/mcp_server_architect.py

# Server started on port 6002
# 18 tools available
```

**Подключение из Cursor:**
```json
{
  "mcp_servers": {
    "architect": {
      "url": "http://localhost:6002"
    }
  }
}
```

---

## 📊 Шаг 3: Типовые задачи

### **Задача 1: Анализ архитектуры**

```python
# Полный граф-анализ
result = await architect.analyze_architecture_graph("ERP")

# Что получите:
# - Coupling: 0.67 (moderate)
# - Cohesion: 0.85 (excellent)
# - Overall: 7.2/10 (Good)
# - 3 циклические зависимости
# - 2 God Objects
# - AI рекомендации
```

**Время:** ~10 секунд

---

### **Задача 2: Поиск проблем**

```python
# Детекция anti-patterns
anti_patterns = await architect.detect_anti_patterns("ERP")

# Что получите:
# - 15 anti-patterns found
# - Quality Grade: C (Acceptable)
# - Refactoring roadmap на 4 недели
# - Top-5 priority fixes
```

**Время:** ~15 секунд

---

### **Задача 3: Выбор технологий**

```python
from src.ai.agents.technology_selector import TechnologySelector

selector = TechnologySelector()

stack = await selector.recommend_technology_stack(
    requirements={"scale": "high", "integration_type": "event-driven"},
    constraints={"budget": "medium"}
)

# Что получите:
# - Integration Bus: Apache Kafka (9.2/10)
# - API Gateway: Kong (8.5/10)
# - Architecture Pattern: Event-Driven Microservices
# - Migration plan
```

**Время:** ~5 секунд

---

### **Задача 4: Генерация ADR**

```python
adr = await architect.generate_adr(
    title="Выбор шины данных",
    context="B2B интеграция, 10K заказов/день",
    problem="REST таймауты",
    alternatives=[...],
    decision="Apache Kafka",
    rationale="Масштабируемость",
    consequences={...}
)

# Что получите:
# - ADR-20251103-142530
# - Markdown файл в docs/adr/
# - Scored alternatives
# - Review date
```

**Время:** ~20 секунд

---

### **Задача 5: Анализ производительности**

```python
from src.ai.agents.performance_analyzer import PerformanceAnalyzer

analyzer = PerformanceAnalyzer()

perf = await analyzer.analyze_performance("ERP", metrics)

# Что получите:
# - Apdex: 0.75 (Fair)
# - 5 bottlenecks
# - Optimization tips
# - Potential speedup: 45%
```

**Время:** ~10 секунд

---

## 💡 Шаг 4: Интеграция в workflow

### **Daily workflow архитектора:**

```python
# Утро: проверка здоровья архитектуры
health = await architect.analyze_architecture_graph("ERP")
if health['health_status'] != 'healthy':
    # Действия по улучшению

# Перед релизом: качество
quality = await architect.detect_anti_patterns("ERP")
if quality['overall_score'] < 6.0:
    # Критические исправления

# Новый проект: выбор технологий
stack = await selector.recommend_technology_stack(...)

# Важное решение: ADR
adr = await architect.generate_adr(...)
```

---

## 📚 Шаг 5: Изучение документации

**Читайте по порядку:**

1. **[START_ARCHITECT_AI.md](START_ARCHITECT_AI.md)** ← Вы здесь
2. **[ARCHITECT_AI_ANALYSIS_AND_GROWTH.md](ARCHITECT_AI_ANALYSIS_AND_GROWTH.md)** - Полный обзор
3. **[ANTI_PATTERNS_CATALOG.md](docs/ANTI_PATTERNS_CATALOG.md)** - Каталог anti-patterns
4. **[ADR_TEMPLATE.md](docs/adr/ADR_TEMPLATE.md)** - Шаблон ADR
5. **[architect_usage_examples.py](examples/architect_usage_examples.py)** - Примеры кода

---

## ⚙️ Требования

**Минимальные:**
- Python 3.11+
- PostgreSQL (для ADR storage)
- Neo4j (для граф-анализа)

**Опциональные:**
- Prometheus/Grafana (для метрик производительности)
- SonarQube (для code smell detection)

---

## 🎓 Обучение

### **30 минут - Базовый уровень:**
- Запустить примеры
- Понять основные функции
- Выполнить первый анализ

### **2 часа - Продвинутый:**
- Изучить все 18 MCP tools
- Настроить интеграции
- Создать первый ADR

### **1 день - Эксперт:**
- Интегрировать в workflow
- Настроить CI/CD проверки
- Обучить команду

---

## 📞 Помощь

**Проблемы?**

1. Проверьте примеры: `python examples/architect_usage_examples.py`
2. Читайте документацию: `ARCHITECT_AI_ANALYSIS_AND_GROWTH.md`
3. Проверьте логи: `logger.info/error`

---

# ✅ ГОТОВО!

**За 5 минут вы научились:**
- ✅ Запускать AI Архитектор
- ✅ Анализировать архитектуру
- ✅ Детектировать anti-patterns
- ✅ Генерировать ADR
- ✅ Выбирать технологии

---

# 🎉 **НАЧИНАЙТЕ ИСПОЛЬЗОВАТЬ!**

```bash
python examples/architect_usage_examples.py
```

**Станьте 10X архитектором!** 🏆


