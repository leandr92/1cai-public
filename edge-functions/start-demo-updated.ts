/**
 * Edge Function: Запуск демонстрации с ИИ-ассистентами
 * Обновлено для работы с пользовательскими задачами из формы
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
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase configuration');
        }

        // Получаем данные из запроса
        const requestData = await req.json();
        const { 
            demo_type = 'quick',
            user_task = '',
            user_id = null,
            roles = ['architect', 'developer'],
            complexity = 'medium',
            include_ml = false,
            custom_scenarios = []
        } = requestData;

        // Валидация обязательных полей
        if (!user_id) {
            throw new Error('user_id is required');
        }

        if (!user_task || user_task.trim() === '') {
            throw new Error('user_task is required and cannot be empty');
        }

        // Генерируем уникальный ID демонстрации
        const demoId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = new Date().toISOString();

        // Определяем конфигурацию демонстрации
        const demoConfig = {
            id: demoId,
            type: demo_type,
            roles: roles,
            complexity: complexity,
            include_ml: include_ml,
            custom_scenarios: custom_scenarios,
            start_time: startTime,
            status: 'processing',
            progress: 10,
            created_by: user_id,
            created_at: startTime,
            updated_at: startTime,
            stages: [
                { name: 'Инициализация', progress: 100, status: 'completed', order: 1 },
                { name: 'Архитектор 1С', progress: 0, status: 'pending', order: 2 },
                { name: 'Разработчик', progress: 0, status: 'pending', order: 3 },
                { name: 'Финализация', progress: 0, status: 'pending', order: 4 }
            ]
        };

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
            const errorText = await demoResponse.text();
            throw new Error(`Failed to create demo: ${demoResponse.status} - ${errorText}`);
        }

        const [demo] = await demoResponse.json();

        // Создаем детальные стадии в demo_stages
        const stagesData = [
            {
                demo_id: demoId,
                stage_name: 'Инициализация',
                stage_order: 1,
                status: 'completed',
                progress: 100,
                started_at: startTime,
                completed_at: startTime,
                output: { message: 'Демонстрация инициализирована', user_task: user_task }
            },
            {
                demo_id: demoId,
                stage_name: 'Анализ задачи',
                stage_order: 2,
                status: 'processing',
                progress: 50,
                started_at: startTime,
                output: { task: user_task, analysis: 'Анализируем требования...' }
            },
            {
                demo_id: demoId,
                stage_name: 'Архитектор 1С',
                stage_order: 3,
                status: 'pending',
                progress: 0,
                output: { role: 'architect', task: user_task }
            },
            {
                demo_id: demoId,
                stage_name: 'Разработчик',
                stage_order: 4,
                status: 'pending',
                progress: 0,
                output: { role: 'developer', task: user_task }
            }
        ];

        // Вставляем стадии
        const stagesResponse = await fetch(`${supabaseUrl}/rest/v1/demo_stages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(stagesData)
        });

        if (!stagesResponse.ok) {
            console.error('Failed to create demo stages:', await stagesResponse.text());
        }

        // Симулируем асинхронную обработку (в реальности это были бы вызовы других Edge Functions)
        // Обновляем прогресс через несколько секунд
        setTimeout(async () => {
            try {
                const completedStages = demoConfig.stages.map(stage => ({
                    ...stage,
                    status: 'completed',
                    progress: 100
                }));

                await fetch(`${supabaseUrl}/rest/v1/demos?id=eq.${demoId}`, {
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
                            user_task: user_task,
                            summary: `Задача "${user_task}" успешно обработана`,
                            architect_output: 'Архитектурное решение готово',
                            developer_output: 'Код реализован',
                            timestamp: new Date().toISOString()
                        }
                    })
                });

                // Обновляем финальные стадии
                await fetch(`${supabaseUrl}/rest/v1/demo_stages?demo_id=eq.${demoId}&stage_order=gte.3`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: 'completed',
                        progress: 100,
                        completed_at: new Date().toISOString()
                    })
                });

                // Создаем уведомление
                await fetch(`${supabaseUrl}/rest/v1/notifications`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: user_id,
                        type: 'demo_completed',
                        title: 'Демонстрация завершена',
                        message: `Задача "${user_task}" успешно выполнена`,
                        data: { demo_id: demoId },
                        is_read: false,
                        created_at: new Date().toISOString()
                    })
                });
            } catch (updateError) {
                console.error('Error updating demo status:', updateError);
            }
        }, 3000); // Завершаем через 3 секунды

        // Возвращаем немедленный ответ
        return new Response(JSON.stringify({
            success: true,
            demo_id: demoId,
            message: 'Демонстрация успешно запущена',
            data: {
                demo: demoConfig,
                user_task: user_task,
                status: 'processing',
                estimated_completion: '3-5 секунд'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Demo start error:', error);
        
        const errorResponse = {
            success: false,
            error: {
                code: 'DEMO_START_ERROR',
                message: error.message || 'Произошла ошибка при запуске демонстрации',
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
