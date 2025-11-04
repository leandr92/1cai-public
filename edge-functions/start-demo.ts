/**
 * Edge Function: Запуск демонстрации с ИИ-ассистентами
 * Запускает автоматизированные демонстрации для всех ролей
 */

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // Получаем данные из запроса
        const requestData = await req.json();
        const { 
            demo_type = 'full', 
            roles = ['architect', 'developer', 'pm', 'ba', 'tester'],
            complexity = 'medium',
            include_ml = true,
            custom_scenarios = []
        } = requestData;

        // Генерируем уникальный ID демонстрации
        const demoId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Определяем конфигурацию демонстрации
        const demoConfig = {
            id: demoId,
            type: demo_type,
            roles: roles,
            complexity: complexity,
            include_ml: include_ml,
            custom_scenarios: custom_scenarios,
            start_time: new Date().toISOString(),
            status: 'initializing',
            progress: 0,
            stages: [
                { name: 'Инициализация', progress: 0, status: 'active' },
                { name: 'Архитектор 1С', progress: 0, status: 'pending' },
                { name: 'Разработчик', progress: 0, status: 'pending' },
                { name: 'Project Manager', progress: 0, status: 'pending' },
                { name: 'Business Analyst', progress: 0, status: 'pending' },
                { name: 'Тестировщик', progress: 0, status: 'pending' },
                { name: 'ML Анализ', progress: 0, status: 'pending' },
                { name: 'Финализация', progress: 0, status: 'pending' }
            ]
        };

        // Сохраняем демонстрацию в Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        // Создаем запись в таблице demos
        const demoResponse = await fetch(`${supabaseUrl}/rest/v1/demos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(demoConfig)
        });

        if (!demoResponse.ok) {
            throw new Error(`Failed to create demo: ${demoResponse.statusText}`);
        }

        const [demo] = await demoResponse.json();

        // Запускаем асинхронные задачи для каждой роли
        const rolePromises = roles.map(async (role, index) => {
            try {
                // Вызываем соответствующую Edge Function для роли
                const roleFunctionUrl = `${supabaseUrl}/functions/v1/demo-${role}`;
                const roleResponse = await fetch(roleFunctionUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        demo_id: demoId,
                        role: role,
                        complexity: complexity,
                        stage_index: index + 1
                    })
                });

                if (roleResponse.ok) {
                    const roleResult = await roleResponse.json();
                    return { role, success: true, result: roleResult };
                } else {
                    return { role, success: false, error: await roleResponse.text() };
                }
            } catch (error) {
                return { role, success: false, error: error.message };
            }
        });

        // Запускаем ML анализ если включен
        let mlResult = null;
        if (include_ml) {
            try {
                const mlFunctionUrl = `${supabaseUrl}/functions/v1/demo-ml-analysis`;
                const mlResponse = await fetch(mlFunctionUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        demo_id: demoId,
                        complexity: complexity
                    })
                });

                if (mlResponse.ok) {
                    mlResult = await mlResponse.json();
                }
            } catch (mlError) {
                console.error('ML analysis error:', mlError);
                mlResult = { success: false, error: mlError.message };
            }
        }

        // Ожидаем завершения всех ролей
        const roleResults = await Promise.all(rolePromises);

        // Обновляем статус демонстрации
        const completedStages = demoConfig.stages.map((stage, index) => {
            if (index === 0) return { ...stage, status: 'completed', progress: 100 };
            if (index <= roles.length) {
                const roleResult = roleResults[index - 1];
                return {
                    ...stage,
                    status: roleResult.success ? 'completed' : 'failed',
                    progress: roleResult.success ? 100 : 0,
                    result: roleResult
                };
            }
            return stage;
        });

        // Добавляем ML стадию
        if (include_ml) {
            const mlStageIndex = roles.length + 1;
            completedStages[mlStageIndex] = {
                name: 'ML Анализ',
                status: mlResult?.success ? 'completed' : 'failed',
                progress: mlResult?.success ? 100 : 0,
                result: mlResult
            };
        }

        // Финальная стадия
        completedStages[completedStages.length - 1] = {
            name: 'Финализация',
            status: 'completed',
            progress: 100,
            result: { summary: 'Демонстрация завершена успешно' }
        };

        // Обновляем демонстрацию
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/demos?id=eq.${demoId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'completed',
                progress: 100,
                stages: completedStages,
                end_time: new Date().toISOString(),
                results: {
                    roles: roleResults,
                    ml_analysis: mlResult
                }
            })
        });

        if (!updateResponse.ok) {
            console.error('Failed to update demo status');
        }

        // Возвращаем результат
        return new Response(JSON.stringify({
            success: true,
            demo_id: demoId,
            message: 'Демонстрация успешно запущена и выполнена',
            data: {
                demo: demoConfig,
                role_results: roleResults,
                ml_result: mlResult,
                stages: completedStages
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Demo start error:', error);
        
        const errorResponse = {
            error: {
                code: 'DEMO_START_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});