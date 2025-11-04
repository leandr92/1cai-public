/**
 * Edge Function: start-demo (v4)
 * Оркестратор демонстрации с реальными вызовами модульных Edge Functions
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

        if (!user_id) {
            throw new Error('user_id is required');
        }

        if (!user_task || user_task.trim() === '') {
            throw new Error('user_task is required and cannot be empty');
        }

        const demoId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = new Date().toISOString();

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

        await demoResponse.json();

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
                stage_name: 'Архитектор 1С',
                stage_order: 2,
                status: 'pending',
                progress: 0,
                output: { role: 'architect', task: user_task }
            },
            {
                demo_id: demoId,
                stage_name: 'Разработчик',
                stage_order: 3,
                status: 'pending',
                progress: 0,
                output: { role: 'developer', task: user_task }
            },
            {
                demo_id: demoId,
                stage_name: 'Финализация',
                stage_order: 4,
                status: 'pending',
                progress: 0,
                output: {}
            }
        ];

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

        // Запускаем асинхронную обработку (не блокируем ответ)
        processDemo(supabaseUrl, supabaseKey, demoId, user_task, complexity, roles, user_id);

        // Возвращаем немедленный ответ
        return new Response(JSON.stringify({
            success: true,
            demo_id: demoId,
            message: 'Демонстрация успешно запущена',
            data: {
                demo: demoConfig,
                user_task: user_task,
                status: 'processing',
                estimated_completion: '5-8 секунд'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Demo start error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: {
                code: 'DEMO_START_ERROR',
                message: error.message || 'Произошла ошибка при запуске демонстрации',
                timestamp: new Date().toISOString()
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Асинхронная функция обработки демонстрации
async function processDemo(supabaseUrl: string, supabaseKey: string, demoId: string, userTask: string, complexity: string, roles: string[], userId: string) {
    try {
        let architectOutput = null;
        let developerOutput = null;

        // Обновляем общий прогресс
        await updateDemoProgress(supabaseUrl, supabaseKey, demoId, 20);

        // Шаг 1: Вызываем архитектора
        if (roles.includes('architect')) {
            try {
                const architectResponse = await fetch(`${supabaseUrl}/functions/v1/demo-architect`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        demo_id: demoId,
                        user_task: userTask,
                        complexity: complexity
                    })
                });

                if (architectResponse.ok) {
                    const architectData = await architectResponse.json();
                    architectOutput = architectData.result;
                }
            } catch (error) {
                console.error('Architect function error:', error);
            }
        }

        await updateDemoProgress(supabaseUrl, supabaseKey, demoId, 50);

        // Шаг 2: Вызываем разработчика
        if (roles.includes('developer')) {
            try {
                const developerResponse = await fetch(`${supabaseUrl}/functions/v1/demo-developer`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        demo_id: demoId,
                        user_task: userTask,
                        architecture_output: architectOutput
                    })
                });

                if (developerResponse.ok) {
                    const developerData = await developerResponse.json();
                    developerOutput = developerData.result;
                }
            } catch (error) {
                console.error('Developer function error:', error);
            }
        }

        await updateDemoProgress(supabaseUrl, supabaseKey, demoId, 80);

        // Финализация
        await updateDemoStage(supabaseUrl, supabaseKey, demoId, 'Финализация', 'completed', 100, {
            summary: 'Демонстрация завершена успешно',
            user_task: userTask
        });

        // Формируем итоговый результат
        const finalResults = {
            user_task: userTask,
            summary: `Задача "${userTask}" успешно обработана`,
            architect_output: architectOutput,
            developer_output: developerOutput,
            timestamp: new Date().toISOString()
        };

        // Обновляем демонстрацию как завершенную
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
                end_time: new Date().toISOString(),
                results: finalResults
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
                user_id: userId,
                type: 'demo_completed',
                title: 'Демонстрация завершена',
                message: `Задача "${userTask}" успешно выполнена`,
                data: { demo_id: demoId },
                is_read: false,
                created_at: new Date().toISOString()
            })
        });

    } catch (error) {
        console.error('Process demo error:', error);
        
        // Обновляем демонстрацию как failed
        await fetch(`${supabaseUrl}/rest/v1/demos?id=eq.${demoId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'failed',
                end_time: new Date().toISOString(),
                results: { error: error.message }
            })
        });
    }
}

async function updateDemoProgress(supabaseUrl: string, supabaseKey: string, demoId: string, progress: number) {
    await fetch(`${supabaseUrl}/rest/v1/demos?id=eq.${demoId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ progress: progress, updated_at: new Date().toISOString() })
    });
}

async function updateDemoStage(supabaseUrl: string, supabaseKey: string, demoId: string, stageName: string, status: string, progress: number, output: any) {
    await fetch(`${supabaseUrl}/rest/v1/demo_stages?demo_id=eq.${demoId}&stage_name=eq.${stageName}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: status,
            progress: progress,
            completed_at: new Date().toISOString(),
            output: output
        })
    });
}
