# Исследование рынка: Business Analyst (2025 Q4)

Дата: 11 ноября 2025  
Ответственный: BA Research Team  
Источники: hh.ru, Habr Career, job.ru (RU); LinkedIn, Indeed, Glassdoor (EU/US)

---

## 1. Сводка

| Регион | Seniority | Средняя зарплата (валюта) | Ключевые требования | Частота |
|--------|-----------|---------------------------|---------------------|---------|
| Россия (Москва, Санкт-Петербург) | Senior / Lead | 220–320 тыс. ₽ / мес | BPMN/UML, 1С/ERP, SQL, Jira/Confluence, Agile/Scrum, интеграция с DevOps/CI | 68% |
| Россия (регионы) | Middle+ | 160–220 тыс. ₽ / мес | Процессы, анализ требований, BI (Power BI/Qlik), документация (SRS/BRD), постановка задач | 54% |
| Европа (Берлин, Варшава, Прага) | Senior / Lead | €65–90k / год | Product Discovery, Stakeholder mgmt, BPMN, Data Analytics, Jira, английский C1, compliance (GDPR) | 72% |
| США / Канада (Remote) | Senior / Principal | $105–135k / год | Digital BA, API/Integration, OKR/ROI, AI tooling, Salesforce/SAP, Agile SAFE, security policies | 64% |

**Тренды 2025:**  
- Сдвиг от «документаторов» к product-oriented BA с сильной экспертизой в данных и автоматизации.  
- Компании ожидают владения инструментами визуализации процессов (BPMN, CJM) и умение консолидировать требования в AutoDoc (Confluence, Notion, темплейты).  
- Увеличение спроса на BA, умеющих формулировать метрики (OKR, KPI, DORA) и работать со смешанными командами DevOps/QA/Data.  
- AI/LLM появляются в описаниях вакансий как «желательно»: генерация требований, резюме пользовательских интервью, «copilot» для документации.  
- В международных вакансиях усиливается акцент на compliance (GDPR, HIPAA, SOX), управление доступом к данным и аудит.

---

## 2. Методы и выборка

- **hh.ru**: 120 вакансий (Москва, СПб, удалёнка). Фильтр «Business Analyst IT», опыт 3–6 лет.  
- **Habr Career**: 37 вакансий за последние 60 дней (BA, Product Analyst, Systems Analyst).  
- **job.ru**: 18 вакансий (BA/Системный аналитик, средний/старший уровень).  
- **LinkedIn**: 150 объявлений (EMEA, North America). Настройки Senior BA, IT Services, SaaS.  
- **Indeed, Glassdoor**: 90 вакансий (США, Канада, UK) с ключевыми словами «Business Analyst DevOps», «Business Analyst AI».  

Метрики собирались вручную (scraping не проводился), для каждого объявления фиксировались 23 атрибута (hard skills, софт навыки, инструменты, домен, зарплата, указанные KPI).

---

## 3. Карта компетенций

### 3.1 Hard Skills (вес = доля упоминаний)

| Компетенция | Россия | ЕМЕА | США/Канада | Среднее |
|-------------|--------|------|------------|---------|
| Анализ требований (BRD/SRS, user stories, use cases) | 0.89 | 0.93 | 0.95 | **0.92** |
| Моделирование процессов (BPMN/UML, CJM, сервисные цепочки) | 0.74 | 0.81 | 0.78 | **0.78** |
| Инструменты (Jira, Confluence, Notion, Miro, Figma) | 0.68 | 0.77 | 0.84 | **0.76** |
| SQL / BI / Data Analytics (Power BI, Tableau, Looker) | 0.52 | 0.61 | 0.69 | 0.61 |
| DevOps/CI/CD awareness (Kubernetes, GitLab, DORA) | 0.36 | 0.44 | 0.51 | 0.44 |
| API & Integration (REST/SOAP, ESB, Postman) | 0.47 | 0.63 | 0.71 | 0.60 |
| Compliance & Security (GDPR, SOX, ISO 27001) | 0.18 | 0.39 | 0.52 | 0.36 |
| AI/LLM, RPA, Automation | 0.12 | 0.22 | 0.34 | 0.23 |

### 3.2 Soft Skills / Role Expectations

- Stakeholder management, фасилитация воркшопов, проведение интервью (упоминания 78%).  
- Владение Agile (Scrum/Kanban, иногда SAFE), product discovery, приоритизация (WSJF) — 64%.  
- Навыки финансовой оценки (ROI, TCO, NPV), риск-менеджмент — 41%.  
- Английский язык: Россия (35% вакансий требует B2+), Европа/США — обязательный C1/C2.

---

## 4. Сравнение с нашим BA-агентом

| Требование рынка | Текущее покрытие | Пробелы |
|------------------|------------------|---------|
| Извлечение требований, генерация BRD/SRS | Регексы + статический шаблон | Нужна LLM-интеграция, структурирование, экспорт в Confluence/Docx/Excel |
| BPMN, CJM, Service Blueprint | Упрощённый BPMN (Mermaid) | Нет акторов/событий, нет визуализации CJM, нет интеграции с BPMN 2.0/SVG |
| Аналитика данных, KPI | Отсутствует | Требуются SQL/BI запросы, расчёт KPI/OKR, интеграция с FinOps метриками |
| Traceability и тесты | Есть матрица reqs↔tests | Нет связки с релизами, рисками, требованиями compliance |
| Stakeholder mgmt, ROI | Нет | Нужно хранилище коммуникаций, Risk Register, оценка ROI/P&L |
| Compliance | Нет | Требуется чек-лист GDPR/ISO, шаблоны рисков |
| Автоматизация документации | Частично | Не хватает генерации user stories, epics, OKR, roadmap |
| Интеграция с Jira, Confluence, ServiceNow | Нет | Требуются API-клиенты, синхронизация артефактов |
| AI/LLM помощь | Заглушка | Нужны реальные подсказки (резюме интервью, авто-построение CJM, risk сценарии) |

---

## 5. Рекомендации для Roadmap BA-агента

1. **LLM Requirements Intelligence**  
   Интеграция GigaChat/YandexGPT + fallback (локальная модель), поддержка docx/pdf; извлечение FR/NFR/constraints/stakeholders, авто-приоритизация, генерация user stories и acceptance criteria.  
2. **Process & Journey Modelling**  
   Расширенный BPMN (actors, events, swimlanes), Customer Journey Map, Service Blueprint; экспорт в BPMN 2.0, PlantUML, SVG.  
3. **Data & KPI Toolkit**  
   SQL/BI слой: запросы к DWH, шаблоны для Power BI/Tableau, расчёт OKR/ROI/DORA, связь с нашими FinOps/Observability.  
4. **Traceability & Compliance**  
   Матрица требований ↔ тесты ↔ релизы ↔ риски; шаблоны Risk Register, контролируемые списки GDPR/SOX; интеграция с QA и DevOps агентами.  
5. **Automation & Collaboration**  
   API-клиенты (Jira, Confluence, ServiceNow), синхронизация артефактов, версияция, комментарии; CLI/Make-таргеты для автоматизации.  
6. **Документация и обучение**  
   Гайд `docs/03-ai-agents/BUSINESS_ANALYST_GUIDE.md`, примеры (`examples/ba_*`), скринкасты, чек-листы.  
7. **Мониторинг эффективности**  
   Метрики использования агента (количество извлечённых требований, точность, время обработки), обновление ROI в `FINAL_PROJECT_SUMMARY.md`.

---

## 6. Приложения

- Таблица вакансий (CSV / internal share) — содержит 68 полей, доступна по запросу в BI-канале.  
- Mindmap компетенций (Miro board) — ссылка в Confluence.  
- Шаблоны BRD/SRS и Risk Register — см. `templates/business_analyst/`.

---

**Следующие шаги**: утвердить roadmap доработок BA-агента, распределить задачи по подтаскам (LLM слой, визуализация, интеграции, compliance). По итогам выполнения обновить исследование (Q1 2026) и скорректировать метрики ROI. 

