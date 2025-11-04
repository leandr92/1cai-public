# 🏗️ Architecture - Архитектура системы

Документация по архитектуре Enterprise 1C AI Stack

---

## 📚 Содержание раздела

1. **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - обзор проекта
2. **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - план реализации
3. **[TECHNOLOGY_STACK.md](./TECHNOLOGY_STACK.md)** - технологический стек
4. **[adr/](./adr/)** - Architecture Decision Records

---

## 🏛️ Архитектурный обзор

### **Уровни системы:**

```
Level 0: Continuous Innovation Engine
Level 1: IDE & Clients (EDT, Cursor, VSCode)
Level 2: Language Services (MCP Server)
Level 3: AI Orchestrator
Level 4: API Gateway (FastAPI, MCP)
Level 5: Data & Search (PostgreSQL, Neo4j, Qdrant, Elasticsearch)
Level 6: Automation & CI/CD
Level 7: Monitoring
Level 8: Infrastructure
```

---

## 🔧 Технологии

- **Backend:** Python 3.11+, FastAPI
- **AI:** Qwen3-Coder, GigaChat, YandexGPT
- **Data:** PostgreSQL 15, Neo4j 5.x, Qdrant, Elasticsearch 8.x
- **Infrastructure:** Docker, Kubernetes, Terraform

---

## 📝 ADR (Architecture Decision Records)

Все архитектурные решения задокументированы в [adr/](./adr/)

---

[← Getting Started](../01-getting-started/) | [→ AI Agents](../03-ai-agents/)


