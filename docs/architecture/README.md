# Architecture Documentation

This folder содержит полный набор архитектурных материалов для 1C AI Stack.

## Структура

```
docs/architecture/
├── 01-high-level-design.md     # Основной HLD-документ
├── README.md                   # Навигация по разделу
└── uml/                        # PlantUML-диаграммы (компоненты, последовательности, деплойменты)
    ├── system-context.puml
    ├── component-overview.puml
    ├── data-flow.puml
    ├── deployment.puml
    └── its-scraper-sequence.puml
```

## Как обновлять

1. Внося функциональные изменения, обновляйте соответствующие разделы `01-high-level-design.md`.
2. Если требуется новая диаграмма — добавьте `.puml` в папку `uml/` и сослитесь на неё из HLD.
3. Для генерации изображений используйте `plantuml` (например, `plantuml -tpng docs/architecture/uml/*.puml -o png`). Сгенерированные `*.png` кладём в `docs/architecture/uml/png/`.
4. CI Workflow `.github/workflows/uml-render-check.yml` проверяет, что PNG актуальны (он сходит в PlantUML и проверит `git diff`). Если тест падает — перегенерируйте `png` и закоммитьте.
5. После изменения архитектуры обязательно фиксируйте это в `README.md` или `CHANGELOG.md`.
6. Поддерживайте консистентность: диаграммы → текст HLD → чек-листы команд → мониторинг.

При доработках или исправлениях — не забудьте синхронизировать код, документацию и диаграммы.

