# Инвентаризация репозиториев @alkoleft

Источник данных: `docs/research/alkoleft_repos.csv` (обновлено `2025-11-10`).

## Области

| Категория | Репозитории | Примечания |
|-----------|-------------|-----------|
| **MCP / AI ассистенты** | [`mcp-bsl-platform-context`](https://github.com/alkoleft/mcp-bsl-platform-context), [`mcp-onec-test-runner`](https://github.com/alkoleft/mcp-onec-test-runner), `bsl-context`, `bsl-context-exporter` | Справка по объектной модели, тест-раннер, генерация контекста |
| **Тестирование / QA** | [`yaxunit`](https://github.com/alkoleft/yaxunit), `yaxunit-addin`, `yaxunit-ai`, `yaxunit-smoke`, `edt-test-runner`, `ie2022-yaxunit-demo`, `vanessa-automation`, `vanessa-runner` | YAxUnit и Vanessa экосистема, интеграция с EDT |
| **Парсеры и AST** | [`tree-sitter-bsl`](https://github.com/alkoleft/tree-sitter-bsl), [`bsl-graph`](https://github.com/alkoleft/bsl-graph), `bsl-language-server`, `bsl-parser`, `bsl_console` | Структурный анализ BSL, LSP, визуализация графов |
| **Инструменты сборки / Actions** | `onec-edtcli-command-action`, `onec-ibcmd-command-action`, `onec-setup-build-env-action`, `cfg_tools`, `ones_git_utils` | Автоматизация CI/CD, утилиты для GIT/EDT |
| **Контент и документация** | [`platform-context-exporter`](https://github.com/alkoleft/platform-context-exporter), [`ones_doc_gen`](https://github.com/alkoleft/ones_doc_gen), `metadata.js`, `onec_markdown_viewer`, `amusement-park-vibe` | Экспорт контекста, генерация документации, UI-приложения |
| **Прочее / архив** | `ai-chatbot`, `alkoleft`, `dt-demo-configuration`, `opm-jhub`, `oscript-library`, `com.minimajack.*`, `toc-md`, `dbschemareader`, `OneScript` | Разные эксперименты, библиотеки, демо-проекты |

## Ключевые находки

- **BSL тестирование**: YAxUnit (и аддины) + edt-test-runner → можно интегрировать в CI (`make test-bsl` уже добавлен).
- **MCP расширения**: подключены платформенный контекст и тест-раннер.
- **AST и анализ**: tree-sitter-bsl и bsl-graph служат референсом для расширенной аналитики (интегрированы в `analyze_*`).
- **Документация**: platform-context-exporter + ones_doc_gen автоматизируют подготовку RAG/доков (теперь доступно через Makefile).
- **CI инструменты**: GitHub Actions для EDT/ibcmd пригодятся при построении шаблонов наших workflow.

## TODO для будущей интеграции

См. актуальный список задач: [`docs/research/alkoleft_todo.md`](./alkoleft_todo.md)

> Благодарим @alkoleft за экосистему инструментов и документацию — многие из них уже стали частью 1C AI Stack.

