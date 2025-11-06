# 📡 API Reference

**1C AI Stack REST API Documentation**

---

## 🌐 Base Information

**Base URL:** `http://localhost:8000`  
**API Version:** v1  
**Format:** JSON  
**Authentication:** API Key (optional)

**Swagger UI:** http://localhost:8000/docs  
**ReDoc:** http://localhost:8000/redoc

---

## 🔍 Search API

### POST /api/search

Semantic code search across 1C configurations.

**Request:**
```json
{
  "query": "расчет НДС",
  "limit": 10,
  "filters": {
    "module_type": "CommonModule",
    "config_name": "ERP"
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "module_name": "НалоговыеРасчеты",
      "function_name": "РассчитатьНДС",
      "code_snippet": "Функция РассчитатьНДС(...)",
      "relevance_score": 0.95,
      "config": "ERP"
    }
  ],
  "total": 1,
  "took_ms": 234
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid query
- `500` - Server error

---

## 🤖 AI Generation API

### POST /api/generate

Generate BSL code using AI.

**Request:**
```json
{
  "description": "функция для отправки email",
  "parameters": [
    {"name": "Адрес", "type": "Строка"},
    {"name": "Тема", "type": "Строка"}
  ],
  "context": {
    "module_type": "CommonModule"
  }
}
```

**Response:**
```json
{
  "code": "Функция ОтправитьEmail(Адрес, Тема) Экспорт\n  // ...",
  "explanation": "Функция отправляет email используя...",
  "confidence": 0.89
}
```

---

## 🔗 Dependencies API

### GET /api/dependencies/{module}/{function}

Get function dependencies (call graph).

**Example:**
```bash
GET /api/dependencies/CommonModule.Utilities/FormatString
```

**Response:**
```json
{
  "function": "FormatString",
  "module": "CommonModule.Utilities",
  "calls": ["СтрЗаменить", "СтрДлина"],
  "called_by": ["ФорматироватьОтчет", "ПодготовитьТекст"],
  "depth": 2
}
```

---

## 📝 Code Review API

### POST /api/code-review

AI-powered code review.

**Request:**
```json
{
  "code": "Функция РассчитатьСумму(Сумма)\n  Возврат Сумма * 1.2;\nКонецФункции",
  "language": "bsl",
  "checks": ["security", "performance", "style"]
}
```

**Response:**
```json
{
  "issues": [
    {
      "severity": "warning",
      "type": "style",
      "line": 1,
      "message": "Отсутствует комментарий функции",
      "suggestion": "Добавьте описание что делает функция"
    }
  ],
  "score": 7.5,
  "summary": "Code is mostly good, minor improvements suggested"
}
```

---

## 🧪 Test Generation API

### POST /api/generate-tests

Generate unit tests for code.

**Request:**
```json
{
  "code": "Функция СложитьЧисла(А, Б)\n  Возврат А + Б;\nКонецФункции",
  "framework": "xUnit"
}
```

**Response:**
```json
{
  "tests": [
    {
      "name": "ТестСложитьЧисла_ПоложительныеЧисла",
      "code": "Процедура ТестСложитьЧисла_ПоложительныеЧисла() Экспорт\n  ...",
      "assertions": 3
    }
  ],
  "coverage_estimate": "85%"
}
```

---

## 📊 Analytics API

### GET /api/stats

Get system statistics.

**Response:**
```json
{
  "modules_indexed": 6708,
  "functions_indexed": 117349,
  "configurations": 8,
  "total_loc": 580049,
  "last_updated": "2025-11-06T12:00:00Z"
}
```

---

### GET /api/stats/usage

Get usage statistics.

**Response:**
```json
{
  "total_requests": 1543,
  "search_requests": 892,
  "generation_requests": 234,
  "avg_response_time_ms": 456,
  "cache_hit_rate": 0.73
}
```

---

## 🔌 Marketplace API

### GET /api/marketplace/plugins

List available plugins.

**Response:**
```json
{
  "plugins": [
    {
      "id": "sql-optimizer-v2",
      "name": "SQL Optimizer v2",
      "version": "2.1.0",
      "author": "community",
      "rating": 4.8,
      "downloads": 1234
    }
  ]
}
```

---

## 🔄 WebSocket API

### ws://localhost:8000/ws

Real-time updates.

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data);
};
```

**Message Types:**
```json
{
  "type": "indexing_progress",
  "data": {
    "current": 1000,
    "total": 6708,
    "percent": 15
  }
}
```

---

## 🔐 Authentication

### API Key (optional)

**Get API Key:**
```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "secure_password"
}

# Response
{
  "api_key": "1c-ai_xxxxxxxxxxxxxxxx"
}
```

**Use API Key:**
```bash
curl -H "X-API-Key: 1c-ai_xxxxxxxx" \
     http://localhost:8000/api/search
```

---

## 📈 Rate Limits

### Default Limits

```yaml
Anonymous: 10 requests/minute
Authenticated: 60 requests/minute
Premium: Unlimited
```

**Headers:**
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1699300000
```

---

## 🐛 Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "Query cannot be empty",
    "details": {
      "field": "query",
      "constraint": "min_length"
    }
  },
  "timestamp": "2025-11-06T12:00:00Z",
  "request_id": "req_abc123"
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_QUERY` | 400 | Query validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 📝 SDK Examples

### Python

```python
import requests

# Search
response = requests.post('http://localhost:8000/api/search', json={
    'query': 'расчет налога',
    'limit': 5
})
results = response.json()

# Generate code
response = requests.post('http://localhost:8000/api/generate', json={
    'description': 'функция для сохранения файла'
})
code = response.json()['code']
```

### JavaScript

```javascript
// Search
const response = await fetch('http://localhost:8000/api/search', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({query: 'расчет НДС', limit: 10})
});
const results = await response.json();
```

### cURL

```bash
# Search
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"расчет скидки","limit":10}'

# Generate
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"description":"функция для проверки email"}'
```

---

## 🔗 Дополнительно

- **Interactive API Docs:** http://localhost:8000/docs
- **OpenAPI Spec:** http://localhost:8000/openapi.json
- **Health Check:** http://localhost:8000/health

---

**Обновлено:** 6 ноября 2025  
**API Version:** 2.2.0

