// Агент-аналитик для анализа задач пользователя
// Анализирует требования и определяет архитектуру решения

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
    const { user_task, demo_id, stage_id } = await req.json();

    if (!user_task) {
      throw new Error('user_task is required');
    }

    // Получаем service role key для работы с БД
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // Анализируем задачу с помощью эвристических правил
    const analysis = analyzeTask(user_task);

    // Обновляем stage если предоставлен
    if (demo_id && stage_id) {
      await updateStage(supabaseUrl, serviceRoleKey, stage_id, {
        status: 'completed',
        progress: 100,
        output: { analysis }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: { analysis }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Analyze task error:', error);
    return new Response(JSON.stringify({
      error: {
        code: 'ANALYSIS_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Функция анализа задачи с реальной логикой
function analyzeTask(userTask: string) {
  const taskLower = userTask.toLowerCase();
  
  // Определяем тип задачи
  const taskType = determineTaskType(taskLower);
  
  // Определяем сложность
  const complexity = determineComplexity(taskLower);
  
  // Определяем необходимые модули 1С
  const requiredModules = determineRequiredModules(taskLower);
  
  // Генерируем рекомендации
  const recommendations = generateRecommendations(taskType, complexity);
  
  // Оцениваем время выполнения
  const estimatedTime = estimateTime(complexity, requiredModules.length);
  
  return {
    taskType,
    complexity,
    requiredModules,
    recommendations,
    estimatedTime,
    timestamp: new Date().toISOString(),
    message: `Анализ завершен: задача типа "${taskType}", сложность ${complexity}`
  };
}

function determineTaskType(task: string): string {
  if (task.includes('отчет') || task.includes('report')) return 'Отчет';
  if (task.includes('документ') || task.includes('document')) return 'Документ';
  if (task.includes('обработка') || task.includes('processing')) return 'Обработка данных';
  if (task.includes('регистр') || task.includes('register')) return 'Регистр';
  if (task.includes('справочник') || task.includes('catalog')) return 'Справочник';
  if (task.includes('интеграция') || task.includes('integration')) return 'Интеграция';
  return 'Общая разработка';
}

function determineComplexity(task: string): string {
  const complexityIndicators = {
    high: ['интеграция', 'api', 'сложн', 'многопоточ', 'обмен', 'синхронизация'],
    medium: ['отчет', 'обработка', 'расчет', 'анализ', 'импорт', 'экспорт'],
    low: ['справочник', 'документ', 'простой', 'вывод', 'список']
  };

  for (const indicator of complexityIndicators.high) {
    if (task.includes(indicator)) return 'Высокая';
  }
  for (const indicator of complexityIndicators.medium) {
    if (task.includes(indicator)) return 'Средняя';
  }
  return 'Низкая';
}

function determineRequiredModules(task: string): string[] {
  const modules: string[] = [];
  
  if (task.includes('продаж') || task.includes('sale')) modules.push('Продажи');
  if (task.includes('склад') || task.includes('warehouse')) modules.push('Склад и запасы');
  if (task.includes('зарплат') || task.includes('payroll')) modules.push('Зарплата и кадры');
  if (task.includes('бухгалтер') || task.includes('accounting')) modules.push('Бухгалтерия');
  if (task.includes('производств') || task.includes('production')) modules.push('Производство');
  if (task.includes('crm') || task.includes('клиент')) modules.push('CRM');
  
  if (modules.length === 0) modules.push('Базовый функционал 1С');
  
  return modules;
}

function generateRecommendations(taskType: string, complexity: string): string[] {
  const recommendations: string[] = [];
  
  recommendations.push(`Для задачи типа "${taskType}" рекомендуется использовать стандартные механизмы 1С`);
  
  if (complexity === 'Высокая') {
    recommendations.push('Реализуйте обработку ошибок и логирование');
    recommendations.push('Предусмотрите транзакционность операций');
    recommendations.push('Добавьте валидацию входных данных');
  }
  
  if (taskType === 'Отчет') {
    recommendations.push('Используйте СКД (Система Компоновки Данных)');
    recommendations.push('Предусмотрите фильтры и группировки');
  }
  
  if (taskType === 'Интеграция') {
    recommendations.push('Используйте HTTP-сервисы для обмена данными');
    recommendations.push('Реализуйте механизм повторных попыток');
  }
  
  recommendations.push('Следуйте best practices разработки 1С');
  
  return recommendations;
}

function estimateTime(complexity: string, modulesCount: number): string {
  const baseTime = {
    'Низкая': 2,
    'Средняя': 5,
    'Высокая': 10
  };
  
  const time = (baseTime[complexity] || 5) + modulesCount;
  return `${time}-${time + 3} часов`;
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
