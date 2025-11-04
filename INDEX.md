# 📑 НАВИГАЦИЯ ПО ПРОЕКТУ

## Enterprise 1C AI Development Stack v4.1

**Быстрая навигация по всем файлам проекта**

---

## 🚀 НАЧНИТЕ ЗДЕСЬ

**Если вы впервые:**
1. **[START_HERE.md](START_HERE.md)** - С ЧЕГО НАЧАТЬ ⭐⭐⭐
2. **[QUICKSTART.md](QUICKSTART.md)** - Быстрый старт за 10 минут
3. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Executive summary

**Если нужно запустить:**
4. **[DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md)** - Полные инструкции
5. **[RUN_MIGRATION.md](RUN_MIGRATION.md)** - Миграция данных

---

## 📚 Основная документация

### Обзор проекта
- [README.md](README.md) - Полное описание проекта
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Executive summary
- [architecture.yaml](architecture.yaml) - Архитектура в YAML

### Статус и прогресс
- [FINAL_IMPLEMENTATION_STATUS.md](FINAL_IMPLEMENTATION_STATUS.md) - Что реализовано
- [STATUS.md](STATUS.md) - Текущий статус
- [WEEK1_COMPLETE.md](WEEK1_COMPLETE.md) - Результаты Week 1
- [CHANGELOG.md](CHANGELOG.md) - История изменений

### Планирование
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) - План на 30 недель ⭐
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Что было сделано
- [NEXT_STEPS.md](NEXT_STEPS.md) - Что делать дальше

### Для разработчиков
- [CONTRIBUTING.md](CONTRIBUTING.md) - Как контрибьютить
- [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md) - Развертывание

---

## 🛠️ Технические файлы

### Конфигурация
- [docker-compose.yml](docker-compose.yml) - Базовая инфраструктура
- [docker-compose.stage1.yml](docker-compose.stage1.yml) - Stage 1 сервисы
- [.env.example](env.example) - Шаблон переменных окружения
- [requirements.txt](requirements.txt) - Python зависимости
- [requirements-stage1.txt](requirements-stage1.txt) - Stage 1 зависимости

### Database
- [db/init/01_schema.sql](db/init/01_schema.sql) - PostgreSQL схема
- [src/db/postgres_saver.py](src/db/postgres_saver.py) - PostgreSQL client
- [src/db/neo4j_client.py](src/db/neo4j_client.py) - Neo4j client
- [src/db/qdrant_client.py](src/db/qdrant_client.py) - Qdrant client

### Parsers
- [parse_edt_xml.py](parse_edt_xml.py) - EDT XML parser v2.0

### Migration Scripts
- [migrate_json_to_postgres.py](migrate_json_to_postgres.py) - JSON → PostgreSQL
- [migrate_postgres_to_neo4j.py](migrate_postgres_to_neo4j.py) - PostgreSQL → Neo4j
- [migrate_to_qdrant.py](migrate_to_qdrant.py) - Векторизация

### API & AI
- [src/api/graph_api.py](src/api/graph_api.py) - FastAPI Graph API
- [src/ai/mcp_server.py](src/ai/mcp_server.py) - MCP Server
- [src/ai/orchestrator.py](src/ai/orchestrator.py) - AI Orchestrator
- [src/services/embedding_service.py](src/services/embedding_service.py) - Embeddings

### EDT Plugin
- [edt-plugin/plugin.xml](edt-plugin/plugin.xml) - Plugin configuration
- [edt-plugin/pom.xml](edt-plugin/pom.xml) - Maven build
- [edt-plugin/src/com/1cai/edt/Activator.java](edt-plugin/src/com/1cai/edt/Activator.java)
- [edt-plugin/src/com/1cai/edt/views/AIAssistantView.java](edt-plugin/src/com/1cai/edt/views/AIAssistantView.java)

### Innovation Engine
- [innovation-engine/discovery_service.py](innovation-engine/discovery_service.py) - GitHub monitor

### CI/CD
- [.github/workflows/build.yml](.github/workflows/build.yml) - Build & test
- [.github/workflows/sonar.yml](.github/workflows/sonar.yml) - SonarQube

### Scripts
- [scripts/setup.sh](scripts/setup.sh) - Initial setup
- [scripts/start.sh](scripts/start.sh) - Start services
- [scripts/stop.sh](scripts/stop.sh) - Stop services

---

## 📊 По компонентам

### База данных
```
PostgreSQL:
├── db/init/01_schema.sql (схема)
└── src/db/postgres_saver.py (client)

Neo4j:
├── src/db/neo4j_client.py (client)
└── migrate_postgres_to_neo4j.py (migration)

Qdrant:
├── src/db/qdrant_client.py (client)
└── migrate_to_qdrant.py (migration)
```

### API
```
REST API:
└── src/api/graph_api.py
   ├── /api/graph/* (Neo4j endpoints)
   ├── /api/search/* (Vector search)
   └── /api/stats/* (Statistics)

MCP:
└── src/ai/mcp_server.py
   ├── /mcp (server info)
   ├── /mcp/tools (list tools)
   └── /mcp/tools/call (execute)
```

### AI
```
Orchestrator:
└── src/ai/orchestrator.py
   ├── QueryClassifier
   ├── AIOrchestrator
   └── Routing logic

Services:
└── src/services/
   └── embedding_service.py
```

### IDE Integration
```
EDT Plugin:
└── edt-plugin/
   ├── plugin.xml (config)
   ├── pom.xml (build)
   └── src/com/1cai/edt/
      ├── Activator.java
      └── views/AIAssistantView.java

Cursor:
└── MCP Server integration
   └── .cursor/mcp.json template
```

---

## 🎯 По задачам

### Хочу запустить проект:
→ [START_HERE.md](START_HERE.md)  
→ [QUICKSTART.md](QUICKSTART.md)  
→ [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md)

### Хочу понять архитектуру:
→ [README.md](README.md)  
→ [architecture.yaml](architecture.yaml)  
→ [FINAL_IMPLEMENTATION_STATUS.md](FINAL_IMPLEMENTATION_STATUS.md)

### Хочу мигрировать данные:
→ [RUN_MIGRATION.md](RUN_MIGRATION.md)  
→ [migrate_json_to_postgres.py](migrate_json_to_postgres.py)  
→ [migrate_postgres_to_neo4j.py](migrate_postgres_to_neo4j.py)

### Хочу разрабатывать:
→ [CONTRIBUTING.md](CONTRIBUTING.md)  
→ [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)  
→ [NEXT_STEPS.md](NEXT_STEPS.md)

### Хочу интегрировать с IDE:
→ [edt-plugin/](edt-plugin/) - EDT Plugin  
→ [src/ai/mcp_server.py](src/ai/mcp_server.py) - MCP Server

### Хочу использовать API:
→ [src/api/graph_api.py](src/api/graph_api.py) - FastAPI endpoints  
→ [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md#проверочные-запросы)

---

## 📦 Файловая структура

```
1c-ai-stack/
│
├── 📄 ENTRY POINTS ⭐
│   ├── START_HERE.md ← НАЧНИТЕ ОТСЮДА!
│   ├── INDEX.md (этот файл)
│   └── README.md
│
├── 📁 Core Configuration
│   ├── docker-compose.yml
│   ├── docker-compose.stage1.yml
│   ├── architecture.yaml
│   ├── requirements.txt
│   └── .env.example
│
├── 📁 Source Code (src/)
│   ├── api/ (FastAPI)
│   ├── ai/ (Orchestrator, MCP)
│   ├── db/ (Database clients)
│   └── services/ (Business logic)
│
├── 📁 EDT Plugin (edt-plugin/)
│   ├── plugin.xml
│   ├── pom.xml
│   └── src/com/1cai/edt/
│
├── 📁 Migration Scripts
│   ├── migrate_json_to_postgres.py
│   ├── migrate_postgres_to_neo4j.py
│   └── migrate_to_qdrant.py
│
├── 📁 Utilities
│   ├── scripts/ (setup, start, stop)
│   ├── db/init/ (SQL schemas)
│   └── nginx/ (reverse proxy)
│
├── 📁 CI/CD
│   └── .github/workflows/
│
├── 📁 Innovation Engine
│   └── innovation-engine/
│
├── 📁 Infrastructure (ready for future)
│   ├── k8s/ (Kubernetes)
│   └── terraform/ (IaC)
│
└── 📁 Documentation
    ├── README.md
    ├── QUICKSTART.md
    ├── IMPLEMENTATION_PLAN.md
    ├── DEPLOYMENT_INSTRUCTIONS.md
    ├── FINAL_IMPLEMENTATION_STATUS.md
    ├── PROJECT_SUMMARY.md
    └── ... и другие (15+ файлов)
```

---

## 🔗 Полезные ссылки

### Внутренние ресурсы:
- [Полный план реализации](IMPLEMENTATION_PLAN.md)
- [Инструкции по развертыванию](DEPLOYMENT_INSTRUCTIONS.md)
- [Статус реализации](FINAL_IMPLEMENTATION_STATUS.md)
- [Миграция данных](RUN_MIGRATION.md)

### External Resources:
- [1c-mcp-metacode](https://github.com/ROCTUP/1c-mcp-metacode) - Inspiration
- [BSL Language Server](https://github.com/1c-syntax/bsl-language-server)
- [OpenYellow](https://openyellow.org) - 1C open-source
- [1С:Напарник](https://code.1c.ai) - Official AI

---

## 🎯 Быстрый доступ

| Задача | Файл |
|--------|------|
| **Запустить проект** | [QUICKSTART.md](QUICKSTART.md) |
| **Мигрировать данные** | [RUN_MIGRATION.md](RUN_MIGRATION.md) |
| **Развернуть production** | [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md) |
| **Разработка плагина** | [edt-plugin/](edt-plugin/) |
| **API документация** | [src/api/graph_api.py](src/api/graph_api.py) |
| **Использовать MCP** | [src/ai/mcp_server.py](src/ai/mcp_server.py) |
| **Планирование** | [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) |
| **Статус проекта** | [FINAL_IMPLEMENTATION_STATUS.md](FINAL_IMPLEMENTATION_STATUS.md) |

---

## ✅ Checklist для начала работы

- [ ] Прочитал START_HERE.md
- [ ] Прочитал QUICKSTART.md
- [ ] Настроил .env файл
- [ ] Запустил Docker services
- [ ] Мигрировал данные
- [ ] Проверил Neo4j Browser
- [ ] Проверил API endpoints
- [ ] Настроил Cursor MCP (опционально)
- [ ] Прочитал IMPLEMENTATION_PLAN.md
- [ ] Готов к разработке!

---

**Удачной работы! 🚀**

**Вопросы? → START_HERE.md → QUICKSTART.md → Создать GitHub Issue**





