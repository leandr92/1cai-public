/**
 * Edge Function: Планирование и автоматизация
 * Управляет планированием задач, автоматизацией процессов и оркестрацией
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
        const requestData = await req.json();
        const { 
            action,
            demo_id,
            plan_id,
            schedule_type = 'immediate',
            automation_rules = [],
            custom_schedule = {}
        } = requestData;

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        let result = {};

        switch (action) {
            case 'create_schedule':
                result = await createSchedule(requestData, supabaseUrl, supabaseKey);
                break;
            case 'execute_plan':
                result = await executePlan(requestData, supabaseUrl, supabaseKey);
                break;
            case 'automate_workflow':
                result = await automateWorkflow(requestData, supabaseUrl, supabaseKey);
                break;
            case 'manage_dependencies':
                result = await manageDependencies(requestData, supabaseUrl, supabaseKey);
                break;
            case 'schedule_recurring':
                result = await scheduleRecurringDemo(requestData, supabaseUrl, supabaseKey);
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({
            success: true,
            action: action,
            data: result
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Planning automation error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'PLANNING_AUTOMATION_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

/**
 * Создание расписания выполнения
 */
async function createSchedule(requestData, supabaseUrl, supabaseKey) {
    const { 
        demo_id,
        schedule_type,
        cron_expression,
        dependencies = [],
        priority = 'medium',
        notification_settings = {}
    } = requestData;

    // Создаем объект расписания
    const schedule = {
        id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        demo_id: demo_id,
        schedule_type: schedule_type,
        cron_expression: cron_expression,
        dependencies: dependencies,
        priority: priority,
        status: 'active',
        created_at: new Date().toISOString(),
        next_execution: calculateNextExecution(schedule_type, cron_expression),
        notification_settings: {
            email_enabled: notification_settings.email_enabled || false,
            webhook_url: notification_settings.webhook_url || null,
            slack_webhook: notification_settings.slack_webhook || null,
            discord_webhook: notification_settings.discord_webhook || null
        }
    };

    // Сохраняем расписание в базу данных
    const response = await fetch(`${supabaseUrl}/rest/v1/demo_schedules`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(schedule)
    });

    if (!response.ok) {
        throw new Error(`Failed to create schedule: ${response.statusText}`);
    }

    const [createdSchedule] = await response.json();

    // Если это cron расписание, создаем фоновую задачу
    if (schedule_type === 'cron' && cron_expression) {
        await createBackgroundTask(schedule, supabaseUrl, supabaseKey);
    }

    return {
        schedule: createdSchedule,
        message: 'Расписание успешно создано',
        next_execution: schedule.next_execution
    };
}

/**
 * Выполнение плана
 */
async function executePlan(requestData, supabaseUrl, supabaseKey) {
    const { 
        plan_id,
        execution_mode = 'sequential',
        parallel_limit = 3,
        timeout_minutes = 60,
        rollback_on_error = true
    } = requestData;

    // Получаем план из базы данных
    const planResponse = await fetch(`${supabaseUrl}/rest/v1/automation_plans?id=eq.${plan_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        }
    });

    if (!planResponse.ok) {
        throw new Error('Plan not found');
    }

    const plans = await planResponse.json();
    if (plans.length === 0) {
        throw new Error('Plan not found');
    }

    const plan = plans[0];

    // Создаем выполнение плана
    const execution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        plan_id: plan_id,
        status: 'running',
        execution_mode: execution_mode,
        started_at: new Date().toISOString(),
        steps_completed: 0,
        total_steps: plan.steps?.length || 0,
        progress: 0
    };

    // Сохраняем выполнение
    const execResponse = await fetch(`${supabaseUrl}/rest/v1/plan_executions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(execution)
    });

    const [createdExecution] = await execResponse.json();

    // Выполняем план
    try {
        const result = await runPlanExecution(plan, execution, execution_mode, parallel_limit, timeout_minutes, supabaseUrl, supabaseKey);

        // Обновляем статус выполнения
        await fetch(`${supabaseUrl}/rest/v1/plan_executions?id=eq.${execution.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: result.success ? 'completed' : 'failed',
                completed_at: new Date().toISOString(),
                result: result,
                progress: 100
            })
        });

        return {
            execution: createdExecution,
            result: result,
            message: result.success ? 'План выполнен успешно' : 'Ошибка выполнения плана'
        };

    } catch (error) {
        // Обновляем статус с ошибкой
        await fetch(`${supabaseUrl}/rest/v1/plan_executions?id=eq.${execution.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'failed',
                completed_at: new Date().toISOString(),
                error: error.message,
                progress: 0
            })
        });

        throw error;
    }
}

/**
 * Автоматизация рабочего процесса
 */
async function automateWorkflow(requestData, supabaseUrl, supabaseKey) {
    const { 
        workflow_type,
        demo_id,
        automation_rules,
        conditions = [],
        actions = []
    } = requestData;

    // Создаем объект автоматизации
    const workflow = {
        id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        demo_id: demo_id,
        workflow_type: workflow_type,
        automation_rules: automation_rules,
        conditions: conditions,
        actions: actions,
        status: 'active',
        created_at: new Date().toISOString(),
        execution_count: 0,
        last_execution: null
    };

    // Сохраняем workflow
    const response = await fetch(`${supabaseUrl}/rest/v1/automation_workflows`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(workflow)
    });

    const [createdWorkflow] = await response.json();

    // Активируем автоматизацию
    await activateAutomationRules(createdWorkflow, supabaseUrl, supabaseKey);

    return {
        workflow: createdWorkflow,
        message: 'Автоматизация рабочего процесса настроена',
        rules_activated: automation_rules.length
    };
}

/**
 * Управление зависимостями
 */
async function manageDependencies(requestData, supabaseUrl, supabaseKey) {
    const { 
        task_id,
        dependencies = [],
        dependency_type = 'completion',
        timeout_minutes = 30
    } = requestData;

    // Проверяем зависимости
    const dependencyChecks = await Promise.all(
        dependencies.map(async (depId) => {
            const depResponse = await fetch(`${supabaseUrl}/rest/v1/tasks?id=eq.${depId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!depResponse.ok) {
                return { id: depId, status: 'not_found', ready: false };
            }

            const deps = await depResponse.json();
            const dep = deps[0];
            
            let ready = false;
            if (dependency_type === 'completion') {
                ready = dep.status === 'completed';
            } else if (dependency_type === 'start') {
                ready = ['running', 'completed'].includes(dep.status);
            }

            return {
                id: depId,
                status: dep.status,
                ready: ready,
                dependency_type: dependency_type
            };
        })
    );

    const allDependenciesReady = dependencyChecks.every(check => check.ready);

    return {
        task_id: task_id,
        dependencies: dependencyChecks,
        all_ready: allDependenciesReady,
        ready_count: dependencyChecks.filter(d => d.ready).length,
        total_count: dependencyChecks.length,
        can_execute: allDependenciesReady
    };
}

/**
 * Создание повторяющихся демонстраций
 */
async function scheduleRecurringDemo(requestData, supabaseUrl, supabaseKey) {
    const { 
        demo_template_id,
        recurrence_pattern,
        start_date,
        end_date,
        notification_settings = {},
        auto_create = true
    } = requestData;

    // Генерируем расписание на основе паттерна
    const scheduleDates = generateRecurrenceDates(recurrence_pattern, start_date, end_date);

    // Создаем расписания для каждой даты
    const schedules = await Promise.all(
        scheduleDates.map(async (date) => {
            const schedule = {
                id: `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                demo_template_id: demo_template_id,
                execution_date: date,
                status: 'scheduled',
                created_at: new Date().toISOString(),
                notification_settings: notification_settings
            };

            const response = await fetch(`${supabaseUrl}/rest/v1/recurring_demos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(schedule)
            });

            return response.ok ? (await response.json())[0] : null;
        })
    );

    return {
        template_id: demo_template_id,
        pattern: recurrence_pattern,
        created_schedules: schedules.filter(s => s !== null),
        total_dates: scheduleDates.length,
        message: `Создано ${schedules.filter(s => s !== null).length} повторяющихся демонстраций`
    };
}

/**
 * Вспомогательные функции
 */
function calculateNextExecution(scheduleType, cronExpression) {
    const now = new Date();
    
    if (scheduleType === 'immediate') {
        return now.toISOString();
    }
    
    if (scheduleType === 'daily') {
        const next = new Date(now);
        next.setDate(next.getDate() + 1);
        next.setHours(9, 0, 0, 0); // 9:00 AM
        return next.toISOString();
    }
    
    if (scheduleType === 'weekly') {
        const next = new Date(now);
        next.setDate(next.getDate() + 7);
        next.setHours(9, 0, 0, 0);
        return next.toISOString();
    }
    
    // Простая обработка cron (можно улучшить с помощью библиотеки)
    if (cronExpression && cronExpression.includes('*/5')) {
        const next = new Date(now);
        next.setMinutes(next.getMinutes() + 5);
        return next.toISOString();
    }
    
    return new Date(now.getTime() + 3600000).toISOString(); // +1 час по умолчанию
}

async function createBackgroundTask(schedule, supabaseUrl, supabaseKey) {
    const task = {
        id: `task_${Date.now()}`,
        type: 'scheduled_demo',
        schedule_id: schedule.id,
        status: 'pending',
        created_at: new Date().toISOString(),
        next_execution: schedule.next_execution
    };

    await fetch(`${supabaseUrl}/rest/v1/background_tasks`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(task)
    });
}

async function runPlanExecution(plan, execution, mode, parallelLimit, timeoutMinutes, supabaseUrl, supabaseKey) {
    const startTime = Date.now();
    const timeout = timeoutMinutes * 60 * 1000;
    const steps = plan.steps || [];
    
    let completedSteps = [];
    let currentStep = 0;

    try {
        if (mode === 'parallel') {
            // Параллельное выполнение
            const batches = [];
            for (let i = 0; i < steps.length; i += parallelLimit) {
                batches.push(steps.slice(i, i + parallelLimit));
            }

            for (const batch of batches) {
                const batchPromises = batch.map(async (step, index) => {
                    const stepExecution = {
                        id: `step_${Date.now()}_${currentStep + index}`,
                        execution_id: execution.id,
                        step_name: step.name,
                        status: 'running',
                        started_at: new Date().toISOString()
                    };

                    // Сохраняем выполнение шага
                    await fetch(`${supabaseUrl}/rest/v1/step_executions`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'apikey': supabaseKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(stepExecution)
                    });

                    // Выполняем шаг
                    const stepResult = await executeStep(step, currentStep + index, supabaseUrl, supabaseKey);

                    // Обновляем статус шага
                    await fetch(`${supabaseUrl}/rest/v1/step_executions?id=eq.${stepExecution.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'apikey': supabaseKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            status: stepResult.success ? 'completed' : 'failed',
                            completed_at: new Date().toISOString(),
                            result: stepResult
                        })
                    });

                    return stepResult;
                });

                const batchResults = await Promise.all(batchPromises);
                completedSteps.push(...batchResults);
                currentStep += batch.length;

                // Проверяем таймаут
                if (Date.now() - startTime > timeout) {
                    throw new Error(`Execution timeout after ${timeoutMinutes} minutes`);
                }
            }
        } else {
            // Последовательное выполнение
            for (const step of steps) {
                const stepResult = await executeStep(step, currentStep, supabaseUrl, supabaseKey);
                completedSteps.push(stepResult);
                currentStep++;

                if (!stepResult.success) {
                    throw new Error(`Step "${step.name}" failed: ${stepResult.error}`);
                }

                // Проверяем таймаут
                if (Date.now() - startTime > timeout) {
                    throw new Error(`Execution timeout after ${timeoutMinutes} minutes`);
                }
            }
        }

        return {
            success: true,
            steps_executed: completedSteps.length,
            results: completedSteps,
            execution_time: Date.now() - startTime
        };

    } catch (error) {
        return {
            success: false,
            error: error.message,
            steps_completed: completedSteps.length,
            execution_time: Date.now() - startTime
        };
    }
}

async function executeStep(step, stepIndex, supabaseUrl, supabaseKey) {
    try {
        // Симуляция выполнения шага
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
        
        const success = Math.random() > 0.1; // 90% успеха
        
        return {
            step_index: stepIndex,
            step_name: step.name,
            success: success,
            result: success ? 'Step executed successfully' : 'Step failed',
            execution_time: Date.now()
        };
    } catch (error) {
        return {
            step_index: stepIndex,
            step_name: step.name,
            success: false,
            error: error.message,
            execution_time: Date.now()
        };
    }
}

async function activateAutomationRules(workflow, supabaseUrl, supabaseKey) {
    // Создаем фоновые правила для автоматизации
    for (const rule of workflow.automation_rules) {
        const backgroundRule = {
            id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            workflow_id: workflow.id,
            rule_type: rule.type,
            conditions: rule.conditions,
            actions: rule.actions,
            status: 'active',
            created_at: new Date().toISOString()
        };

        await fetch(`${supabaseUrl}/rest/v1/automation_rules`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(backgroundRule)
        });
    }
}

function generateRecurrenceDates(pattern, startDate, endDate) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    switch (pattern.type) {
        case 'daily':
            for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                dates.push(new Date(date));
            }
            break;
        case 'weekly':
            for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 7)) {
                dates.push(new Date(date));
            }
            break;
        case 'monthly':
            for (let date = new Date(start); date <= end; date.setMonth(date.getMonth() + 1)) {
                dates.push(new Date(date));
            }
            break;
        default:
            dates.push(new Date(start));
    }
    
    return dates;
}