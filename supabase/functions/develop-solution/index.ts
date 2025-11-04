// Агент-разработчик для генерации кода 1С
// Создает решения на основе анализа задачи

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { user_task, analysis, demo_id, stage_id } = await req.json();

    if (!user_task) {
      throw new Error('user_task is required');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // Генерируем решение на основе задачи и анализа
    const solution = generateSolution(user_task, analysis);

    // Обновляем stage если предоставлен
    if (demo_id && stage_id) {
      await updateStage(supabaseUrl, serviceRoleKey, stage_id, {
        status: 'completed',
        progress: 100,
        output: { development: solution }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: { solution }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Develop solution error:', error);
    return new Response(JSON.stringify({
      error: {
        code: 'DEVELOPMENT_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generateSolution(userTask: string, analysis: any) {
  const taskLower = userTask.toLowerCase();
  const taskType = analysis?.taskType || 'Общая разработка';
  
  // Генерируем код на основе типа задачи
  const generatedCode = generateCode(taskType, taskLower);
  
  // Генерируем документацию
  const documentation = generateDocumentation(taskType, userTask);
  
  // Генерируем примеры использования
  const examples = generateExamples(taskType);
  
  return {
    taskType,
    generatedFiles: calculateFileCount(taskType),
    codeSnippets: generatedCode,
    documentation,
    examples,
    timestamp: new Date().toISOString(),
    message: `Решение создано: ${calculateFileCount(taskType)} файлов`
  };
}

function generateCode(taskType: string, task: string): any[] {
  const snippets: any[] = [];
  
  switch (taskType) {
    case 'Отчет':
      snippets.push({
        fileName: 'Отчет.Report',
        language: '1C:Enterprise',
        code: generateReportCode(task),
        description: 'Схема компоновки данных для отчета'
      });
      snippets.push({
        fileName: 'Отчет.ObjectModule',
        language: '1C:Enterprise',
        code: generateReportModule(),
        description: 'Модуль объекта отчета'
      });
      break;
      
    case 'Документ':
      snippets.push({
        fileName: 'Документ.Manager',
        language: '1C:Enterprise',
        code: generateDocumentCode(task),
        description: 'Модуль менеджера документа'
      });
      snippets.push({
        fileName: 'Документ.Form',
        language: '1C:Enterprise',
        code: generateDocumentForm(),
        description: 'Форма документа'
      });
      break;
      
    case 'Обработка данных':
      snippets.push({
        fileName: 'Обработка.Module',
        language: '1C:Enterprise',
        code: generateProcessingCode(task),
        description: 'Модуль обработки данных'
      });
      break;
      
    default:
      snippets.push({
        fileName: 'Решение.Module',
        language: '1C:Enterprise',
        code: generateGenericCode(task),
        description: 'Общий модуль решения'
      });
  }
  
  return snippets;
}

function generateReportCode(task: string): string {
  return `// Отчет: ${task}
// Сгенерировано автоматически

Процедура ПриКомпоновкеРезультата(ДокументРезультат, ДанныеРасшифровки, СтандартнаяОбработка)
    // Получение данных для отчета
    Запрос = Новый Запрос;
    Запрос.Текст = "
        |ВЫБРАТЬ
        |    Данные.Наименование КАК Наименование,
        |    Данные.Сумма КАК Сумма
        |ИЗ
        |    Таблица КАК Данные
        |ГДЕ
        |    Данные.Период МЕЖДУ &ДатаНачала И &ДатаОкончания";
    
    Запрос.УстановитьПараметр("ДатаНачала", НачалоПериода);
    Запрос.УстановитьПараметр("ДатаОкончания", КонецПериода);
    
    Результат = Запрос.Выполнить();
    
    // Вывод результатов
    КомпоновщикНастроек.Настройки.ДополнительныеСвойства.Вставить("Результат", Результат);
КонецПроцедуры`;
}

function generateReportModule(): string {
  return `// Модуль объекта отчета

Функция СформироватьОтчет() Экспорт
    // Формирование отчета
    КомпоновщикНастроек = Новый КомпоновщикНастроекКомпоновкиДанных;
    КомпоновщикНастроек.Инициализировать(СхемаКомпоновкиДанных);
    
    // Параметры отчета
    Параметры = КомпоновщикНастроек.Настройки.ПараметрыДанных;
    
    Возврат Истина;
КонецФункции`;
}

function generateDocumentCode(task: string): string {
  return `// Документ: ${task}
// Модуль менеджера

Процедура ПередЗаписью(Отказ, РежимЗаписи, РежимПроведения)
    // Проверка заполнения обязательных реквизитов
    Если НЕ ЗначениеЗаполнено(Дата) Тогда
        Сообщить("Не заполнена дата документа");
        Отказ = Истина;
        Возврат;
    КонецЕсли;
    
    // Установка номера документа
    Если Номер = "" Тогда
        Номер = ПолучитьСледующийНомер();
    КонецЕсли;
КонецПроцедуры

Процедура ПриПроведении(Отказ, РежимПроведения)
    // Движения документа
    Движения.Очистить();
    
    // Регистрация движений
    Для Каждого СтрокаТабличнойЧасти Из ТабличнаяЧасть Цикл
        Движение = Движения.Регистр.Добавить();
        Движение.Период = Дата;
        Движение.Документ = Ссылка;
        // ... заполнение остальных полей
    КонецЦикла;
    
    // Запись движений
    Движения.Записать();
КонецПроцедуры`;
}

function generateDocumentForm(): string {
  return `// Форма документа

Процедура ПриОткрытии(Отказ)
    // Инициализация формы
    УстановитьВидимостьЭлементов();
    ОбновитьИтоги();
КонецПроцедуры

Процедура УстановитьВидимостьЭлементов()
    // Настройка видимости элементов формы
    Элементы.ТабличнаяЧасть.Видимость = Истина;
КонецПроцедуры

Процедура ОбновитьИтоги()
    // Расчет итогов
    Итого = 0;
    Для Каждого Строка Из Объект.ТабличнаяЧасть Цикл
        Итого = Итого + Строка.Сумма;
    КонецЦикла;
    Объект.ИтоговаяСумма = Итого;
КонецПроцедуры`;
}

function generateProcessingCode(task: string): string {
  return `// Обработка: ${task}
// Модуль обработки

Процедура Выполнить() Экспорт
    // Основная логика обработки
    НачатьТранзакцию();
    
    Попытка
        // Обработка данных
        ОбработатьДанные();
        
        // Фиксация транзакции
        ЗафиксироватьТранзакцию();
        
        Сообщить("Обработка выполнена успешно");
    Исключение
        // Откат транзакции при ошибке
        ОтменитьТранзакцию();
        Сообщить("Ошибка обработки: " + ОписаниеОшибки());
    КонецПопытки;
КонецПроцедуры

Процедура ОбработатьДанные()
    // Логика обработки данных
    Запрос = Новый Запрос;
    Запрос.Текст = "ВЫБРАТЬ * ИЗ Таблица";
    
    Выборка = Запрос.Выполнить().Выбрать();
    
    Пока Выборка.Следующий() Цикл
        // Обработка каждой записи
        ОбработатьЗапись(Выборка);
    КонецЦикла;
КонецПроцедуры`;
}

function generateGenericCode(task: string): string {
  return `// Решение: ${task}
// Общий модуль

Функция ВыполнитьЗадачу() Экспорт
    Результат = Новый Структура;
    Результат.Вставить("Успех", Истина);
    Результат.Вставить("Данные", ПолучитьДанные());
    
    Возврат Результат;
КонецФункции

Функция ПолучитьДанные()
    // Получение необходимых данных
    Данные = Новый Массив;
    
    // Логика получения данных
    
    Возврат Данные;
КонецФункции`;
}

function generateDocumentation(taskType: string, task: string): string {
  return `# Документация: ${task}

## Описание
Автоматически сгенерированное решение для задачи типа "${taskType}".

## Установка
1. Скопируйте сгенерированные файлы в конфигурацию 1С
2. Выполните обновление конфигурации базы данных
3. Проверьте работоспособность решения

## Использование
Решение готово к использованию после установки. Следуйте примерам кода для интеграции в вашу систему.

## Требования
- 1С:Предприятие 8.3 или выше
- Базовый функционал 1С

## Поддержка
Для получения помощи обратитесь к документации 1С или технической поддержке.
`;
}

function generateExamples(taskType: string): string[] {
  const examples: string[] = [];
  
  examples.push(`// Пример 1: Вызов основной функции
Результат = ВыполнитьЗадачу();
Если Результат.Успех Тогда
    Сообщить("Задача выполнена успешно");
КонецЕсли;`);

  if (taskType === 'Отчет') {
    examples.push(`// Пример 2: Формирование отчета
Отчет = Отчеты.НовыйОтчет.Создать();
Отчет.СформироватьОтчет();`);
  }

  if (taskType === 'Документ') {
    examples.push(`// Пример 2: Создание документа
НовыйДокумент = Документы.НовыйДокумент.СоздатьДокумент();
НовыйДокумент.Дата = ТекущаяДата();
НовыйДокумент.Записать();`);
  }

  return examples;
}

function calculateFileCount(taskType: string): number {
  const fileCounts = {
    'Отчет': 3,
    'Документ': 4,
    'Обработка данных': 2,
    'Справочник': 3,
    'Интеграция': 5
  };
  
  return fileCounts[taskType] || 2;
}

async function updateStage(url: string, key: string, stageId: string, updates: any) {
  const response = await fetch(`${url}/rest/v1/demo_stages?id=eq.${stageId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${key}`,
      'apikey': key,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      ...updates,
      completed_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to update stage: ${await response.text()}`);
  }
}
