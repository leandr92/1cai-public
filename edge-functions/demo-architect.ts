/**
 * Edge Function: demo-architect
 * Роль: 1С Архитектор - анализ требований и проектирование решения
 */

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        const { demo_id, user_task, complexity = 'medium' } = await req.json();

        if (!demo_id || !user_task) {
            throw new Error('demo_id и user_task обязательны');
        }

        // Обновляем стадию на "processing"
        await fetch(`${supabaseUrl}/rest/v1/demo_stages?demo_id=eq.${demo_id}&stage_name=eq.Архитектор 1С`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'processing',
                progress: 30,
                started_at: new Date().toISOString(),
                output: { message: 'Начинаем архитектурный анализ...', task: user_task }
            })
        });

        // Симуляция обработки (2 секунды)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Анализ задачи на основе ключевых слов
        const taskLower = user_task.toLowerCase();
        let architectureRecommendations = [];
        let estimatedComplexity = complexity;
        let requiredModules = [];

        // Анализ типа задачи
        if (taskLower.includes('отчет') || taskLower.includes('report')) {
            architectureRecommendations.push('Использовать СКД (Система Компоновки Данных)');
            architectureRecommendations.push('Создать внешний отчет или расширить типовой');
            requiredModules.push('Подсистема отчетности');
        }
        
        if (taskLower.includes('документ') || taskLower.includes('накладн')) {
            architectureRecommendations.push('Создать новый документ или расширить существующий');
            architectureRecommendations.push('Определить движения по регистрам');
            requiredModules.push('Документооборот', 'Регистры накопления');
        }
        
        if (taskLower.includes('интеграц') || taskLower.includes('обмен') || taskLower.includes('api')) {
            architectureRecommendations.push('Использовать HTTP-сервисы или REST API');
            architectureRecommendations.push('Реализовать очередь обмена');
            requiredModules.push('Подсистема обмена данными');
            estimatedComplexity = 'high';
        }
        
        if (taskLower.includes('права') || taskLower.includes('доступ')) {
            architectureRecommendations.push('Настроить профили и роли пользователей');
            architectureRecommendations.push('Использовать RLS (Row Level Security) для данных');
            requiredModules.push('Управление доступом');
        }

        // Если не определили специфику - общие рекомендации
        if (architectureRecommendations.length === 0) {
            architectureRecommendations.push('Провести детальный анализ требований');
            architectureRecommendations.push('Определить затрагиваемые объекты метаданных');
            requiredModules.push('Общие механизмы 1С');
        }

        const result = {
            status: 'completed',
            analysis: {
                task: user_task,
                complexity: estimatedComplexity,
                recommendations: architectureRecommendations,
                required_modules: requiredModules,
                estimated_hours: estimatedComplexity === 'high' ? 40 : estimatedComplexity === 'medium' ? 24 : 8,
                architecture_notes: `Архитектурное решение для: "${user_task}". Рекомендуется модульный подход с использованием стандартных механизмов 1С.`
            },
            timestamp: new Date().toISOString()
        };

        // Обновляем стадию на "completed"
        await fetch(`${supabaseUrl}/rest/v1/demo_stages?demo_id=eq.${demo_id}&stage_name=eq.Архитектор 1С`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'completed',
                progress: 100,
                completed_at: new Date().toISOString(),
                output: result
            })
        });

        return new Response(JSON.stringify({
            success: true,
            role: 'architect',
            demo_id: demo_id,
            result: result
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Architect function error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: {
                code: 'ARCHITECT_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
