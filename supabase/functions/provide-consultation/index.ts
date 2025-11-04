// Агент-консультант для предоставления рекомендаций
// Анализирует решение и предлагает улучшения

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
    const { user_task, analysis, solution, demo_id, stage_id } = await req.json();

    if (!user_task) {
      throw new Error('user_task is required');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // Генерируем консультацию
    const consultation = provideConsultation(user_task, analysis, solution);

    // Обновляем stage если предоставлен
    if (demo_id && stage_id) {
      await updateStage(supabaseUrl, serviceRoleKey, stage_id, {
        status: 'completed',
        progress: 100,
        output: { consultation }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: { consultation }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Provide consultation error:', error);
    return new Response(JSON.stringify({
      error: {
        code: 'CONSULTATION_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function provideConsultation(userTask: string, analysis: any, solution: any) {
  const taskType = analysis?.taskType || 'Общая разработка';
  const complexity = analysis?.complexity || 'Средняя';
  
  // Генерируем best practices
  const bestPractices = generateBestPractices(taskType, complexity);
  
  // Генерируем предупреждения
  const warnings = generateWarnings(taskType);
  
  // Генерируем советы по оптимизации
  const optimizations = generateOptimizations(taskType, complexity);
  
  // Генерируем план тестирования
  const testingPlan = generateTestingPlan(taskType);
  
  // Генерируем чеклист деплоя
  const deploymentChecklist = generateDeploymentChecklist();
  
  return {
    bestPractices,
    warnings,
    optimizations,
    testingPlan,
    deploymentChecklist,
    timestamp: new Date().toISOString(),
    message: `Консультация подготовлена: ${bestPractices.length} рекомендаций`
  };
}

function generateBestPractices(taskType: string, complexity: string): string[] {
  const practices: string[] = [];
  
  // Общие best practices
  practices.push('Используйте транзакции для всех операций модификации данных');
  practices.push('Реализуйте обработку исключений для критичных участков кода');
  practices.push('Добавьте логирование важных операций в журнал регистрации');
  practices.push('Комментируйте сложную логику для упрощения поддержки');
  
  // Специфичные для типа задачи
  if (taskType === 'Отчет') {
    practices.push('Оптимизируйте запросы - избегайте вложенных подзапросов');
    practices.push('Используйте индексы для полей в условиях WHERE');
    practices.push('Ограничьте объем выборки данных параметрами отчета');
  } else if (taskType === 'Документ') {
    practices.push('Проверяйте заполнение обязательных реквизитов перед записью');
    practices.push('Используйте блокировки при работе с регистрами');
    practices.push('Реализуйте отмену проведения документа');
  } else if (taskType === 'Обработка данных') {
    practices.push('Используйте пакетную обработку для больших объемов');
    practices.push('Показывайте прогресс длительных операций пользователю');
    practices.push('Предусмотрите возможность отмены операции');
  } else if (taskType === 'Интеграция') {
    practices.push('Реализуйте механизм повторных попыток при сбоях');
    practices.push('Логируйте все запросы и ответы API');
    practices.push('Используйте тайм-ауты для внешних запросов');
    practices.push('Валидируйте данные перед отправкой');
  }
  
  // Зависит от сложности
  if (complexity === 'Высокая') {
    practices.push('Разделите сложную логику на небольшие функции');
    practices.push('Напишите unit-тесты для критичных функций');
    practices.push('Проведите code review перед релизом');
  }
  
  return practices;
}

function generateWarnings(taskType: string): string[] {
  const warnings: string[] = [];
  
  warnings.push('⚠️ Протестируйте решение на копии базы перед применением в продакшене');
  warnings.push('⚠️ Создайте резервную копию базы данных перед внедрением');
  
  if (taskType === 'Документ') {
    warnings.push('⚠️ Убедитесь, что движения документа корректно формируются');
    warnings.push('⚠️ Проверьте права доступа для всех ролей');
  } else if (taskType === 'Интеграция') {
    warnings.push('⚠️ Проверьте работу в условиях нестабильного интернет-соединения');
    warnings.push('⚠️ Убедитесь в корректности обработки ошибок API');
  } else if (taskType === 'Обработка данных') {
    warnings.push('⚠️ Тестируйте на больших объемах данных');
    warnings.push('⚠️ Убедитесь, что операция может быть безопасно прервана');
  }
  
  warnings.push('⚠️ Документируйте все изменения в конфигурации');
  
  return warnings;
}

function generateOptimizations(taskType: string, complexity: string): string[] {
  const optimizations: string[] = [];
  
  if (taskType === 'Отчет') {
    optimizations.push('Используйте виртуальные таблицы для часто используемых выборок');
    optimizations.push('Кэшируйте результаты медленных запросов');
    optimizations.push('Используйте временные таблицы для промежуточных результатов');
    optimizations.push('Добавьте индексы для полей, используемых в сортировке');
  } else if (taskType === 'Документ') {
    optimizations.push('Отложите проведение документа для пакетной обработки');
    optimizations.push('Используйте подписки на события для связанных объектов');
  } else if (taskType === 'Обработка данных') {
    optimizations.push('Обрабатывайте данные порциями (например, по 1000 записей)');
    optimizations.push('Используйте параллельную обработку для независимых операций');
    optimizations.push('Минимизируйте количество обращений к базе данных');
  }
  
  optimizations.push('Используйте кэширование для часто читаемых данных');
  optimizations.push('Оптимизируйте работу с формами - ленивая загрузка данных');
  
  if (complexity === 'Высокая') {
    optimizations.push('Рассмотрите возможность асинхронного выполнения');
    optimizations.push('Профилируйте код для выявления узких мест');
  }
  
  return optimizations;
}

function generateTestingPlan(taskType: string): string[] {
  const plan: string[] = [];
  
  plan.push('1. Модульное тестирование: проверка отдельных функций');
  plan.push('2. Интеграционное тестирование: проверка взаимодействия компонентов');
  
  if (taskType === 'Документ') {
    plan.push('3. Тестирование проведения/отмены проведения документа');
    plan.push('4. Проверка корректности движений по регистрам');
    plan.push('5. Тестирование прав доступа');
  } else if (taskType === 'Отчет') {
    plan.push('3. Проверка корректности расчетов на тестовых данных');
    plan.push('4. Тестирование фильтров и группировок');
    plan.push('5. Проверка производительности на больших объемах');
  } else if (taskType === 'Обработка данных') {
    plan.push('3. Тестирование на различных объемах данных');
    plan.push('4. Проверка обработки ошибок');
    plan.push('5. Тестирование отмены операции');
  } else if (taskType === 'Интеграция') {
    plan.push('3. Тестирование успешных запросов API');
    plan.push('4. Тестирование обработки ошибок API');
    plan.push('5. Проверка работы при отсутствии сети');
  }
  
  plan.push('6. Нагрузочное тестирование (при необходимости)');
  plan.push('7. Приемочное тестирование с конечными пользователями');
  
  return plan;
}

function generateDeploymentChecklist(): string[] {
  return [
    '☐ Создана резервная копия базы данных',
    '☐ Проведено тестирование на тестовой базе',
    '☐ Получено одобрение от ответственных лиц',
    '☐ Обновлена документация',
    '☐ Уведомлены пользователи о предстоящих изменениях',
    '☐ Запланировано окно обслуживания (если требуется)',
    '☐ Подготовлен план отката изменений',
    '☐ Проведена проверка производительности',
    '☐ Настроены права доступа',
    '☐ Проведено обучение пользователей (если требуется)',
    '☐ Подготовлена поддержка на период внедрения',
    '☐ Настроен мониторинг работы системы'
  ];
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
