# 1С:Copilot - VSCode Extension

> AI pair programmer для 1С разработки

## ✨ Features

- **Context-Aware Autocomplete** - умные подсказки во время набора
- **Function Generation** - создание функций по описанию
- **Code Optimization** - автоматическая оптимизация кода
- **Test Generation** - генерация unit тестов

## 🚀 Installation

### From VSIX (local)

```bash
# Build extension
npm install
npm run compile
vsce package

# Install
code --install-extension 1c-copilot-0.1.0.vsix
```

### From Marketplace (TODO)

```
Search "1С:Copilot" in VSCode Extensions
```

## ⚙️ Configuration

1. Open VSCode Settings
2. Search "1c-copilot"
3. Configure:

```json
{
  "1c-copilot.apiUrl": "https://api.1c-ai.com/api/copilot",
  "1c-copilot.apiKey": "your-api-key-here",
  "1c-copilot.autoComplete": true
}
```

## 🎯 Usage

### Autocomplete

Просто начните печатать BSL код - suggestions появятся автоматически!

### Generate Function

1. Напишите комментарий с описанием
2. Press `Ctrl+Shift+G` (или Cmd+Shift+G на Mac)
3. AI сгенерирует функцию!

**Example:**

```bsl
// AI: Создай функцию для расчета НДС

// Press Ctrl+Shift+G → AI generates:

Функция РассчитатьНДС(Сумма, СтавкаНДС = 20) Экспорт
    СуммаНДС = Сумма * СтавкаНДС / 100;
    Возврат Окр(СуммаНДС, 2);
КонецФункции
```

### Optimize Code

1. Select code
2. Right click → "1С:Copilot: Optimize Code"
3. AI оптимизирует!

### Generate Tests

1. Select function
2. Right click → "1С:Copilot: Generate Tests"
3. Tests created in new file!

## 🛠️ Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode
npm run watch

# Run extension (F5 in VSCode)
```

## 📄 License

MIT

## 🤝 Contributing

Pull requests welcome!

## 📞 Support

- Issues: GitHub Issues
- Docs: https://docs.1c-ai.com


