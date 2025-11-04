# Развертывание RAG Retriever Edge Function

## Быстрый старт

1. **Примените миграцию базы данных:**
```bash
supabase db push
```

2. **Разверните Edge Function:**
```bash
supabase functions deploy rag-retriever
```

3. **Настройте переменные окружения:**
   - Добавьте `OPENAI_API_KEY` в переменные проекта (опционально)
   - Убедитесь что `SUPABASE_URL` и ключи доступа настроены

## Тестирование

```bash
curl -X POST https://your-project.supabase.co/functions/v1/rag-retriever \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Как создать справочник в 1С Предприятие?",
    "limit": 5,
    "useHybridSearch": true
  }'
```

## Структура файлов

```
supabase/
├── functions/
│   └── rag-retriever/
│       ├── index.ts          # Основная Edge Function
│       └── README.md         # Подробная документация
└── migrations/
    └── 1762000000_create_match_documents_function.sql  # Функции БД
```