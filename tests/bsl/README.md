# BSL Test Manifest

`tests/bsl/testplan.json` описывает запуск тестов 1С/BSL внутри CI. Формат — массив объектов:

```json
[
  {
    "name": "yaxunit-smoke",
    "command": [
      "oscript",
      "tools/yaxunit/src/cli/yaxunit-runner.os",
      "--workspace",
      "tests/bsl/yaxunit-smoke"
    ],
    "working_directory": "tests/bsl/yaxunit-smoke",
    "env": {
      "YAXUNIT_OPTS": "--report=junit --output=reports"
    },
    "timeout": 1800
  }
]
```

По умолчанию файл содержит пустой массив `[]`, поэтому `make test-bsl` и job `bsl-tests` в CI выполняются мгновенно (skip), пока тесты не настроены.

## Как подключить проекты

1. Установить OneScript и подготовить YAxUnit/Vanessa (см. [alkoleft/yaxunit](https://github.com/alkoleft/yaxunit) — благодарим @alkoleft за открытый фреймворк и документацию).
2. Добавить запись в `testplan.json`, указав команду запуска, рабочую директорию, переменные окружения и таймаут.
3. Локально выполнить `make test-bsl` и убедиться, что логи попадают в `output/bsl-tests`.
4. Закоммитить изменения и проверить job `BSL Tests` в GitHub Actions.

Логи и артефакты автоматически выгружаются в CI (`bsl-test-artifacts`). После внедрения конкретных сценариев расширите документацию (HLD/README/CASE_STUDIES) и добавьте ссылку на использованный репозиторий с благодарностью.

