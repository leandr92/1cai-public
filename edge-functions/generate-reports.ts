/**
 * Edge Function: Обработка результатов и генерация отчетов
 * Обрабатывает результаты демонстраций и генерирует комплексные отчеты
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
            demo_id,
            report_type = 'comprehensive',
            include_charts = true,
            include_recommendations = true,
            format = 'json',
            language = 'ru'
        } = requestData;

        if (!demo_id) {
            throw new Error('demo_id is required');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        // Получаем данные демонстрации
        const demoResponse = await fetch(`${supabaseUrl}/rest/v1/demos?id=eq.${demo_id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            }
        });

        if (!demoResponse.ok) {
            throw new Error('Failed to fetch demo data');
        }

        const demos = await demoResponse.json();
        if (demos.length === 0) {
            throw new Error('Demo not found');
        }

        const demo = demos[0];

        // Получаем детальные результаты по ролям
        const roleResultsResponse = await fetch(`${supabaseUrl}/rest/v1/demo_roles?demo_id=eq.${demo_id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            }
        });

        const roleResults = roleResultsResponse.ok ? await roleResultsResponse.json() : [];

        // Получаем метрики производительности
        const metricsResponse = await fetch(`${supabaseUrl}/rest/v1/demo_metrics?demo_id=eq.${demo_id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            }
        });

        const metrics = metricsResponse.ok ? await metricsResponse.json() : [];

        // Генерируем отчет на основе типа
        let reportData = {};

        if (report_type === 'executive') {
            reportData = await generateExecutiveReport(demo, roleResults, metrics);
        } else if (report_type === 'technical') {
            reportData = await generateTechnicalReport(demo, roleResults, metrics);
        } else if (report_type === 'performance') {
            reportData = await generatePerformanceReport(demo, roleResults, metrics);
        } else {
            reportData = await generateComprehensiveReport(demo, roleResults, metrics);
        }

        // Генерируем рекомендации если требуется
        let recommendations = [];
        if (include_recommendations) {
            recommendations = await generateRecommendations(demo, roleResults, metrics);
        }

        // Создаем итоговый отчет
        const report = {
            id: `report_${Date.now()}`,
            demo_id: demo_id,
            type: report_type,
            format: format,
            language: language,
            generated_at: new Date().toISOString(),
            summary: reportData.summary,
            sections: reportData.sections,
            metrics: reportData.metrics,
            charts: include_charts ? reportData.charts : null,
            recommendations: recommendations,
            conclusion: reportData.conclusion
        };

        // Сохраняем отчет в базу данных
        const reportResponse = await fetch(`${supabaseUrl}/rest/v1/demo_reports`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(report)
        });

        if (!reportResponse.ok) {
            console.error('Failed to save report to database');
        }

        // Форматируем ответ в зависимости от формата
        let formattedResponse = report;
        if (format === 'html') {
            formattedResponse = await generateHTMLReport(report);
        } else if (format === 'pdf') {
            formattedResponse = await generatePDFData(report);
        }

        return new Response(JSON.stringify({
            success: true,
            report_id: report.id,
            message: 'Отчет успешно сгенерирован',
            data: formattedResponse
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Report generation error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'REPORT_GENERATION_ERROR',
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
 * Генерация исполнительного отчета
 */
async function generateExecutiveReport(demo, roleResults, metrics) {
    const totalRoles = roleResults.length;
    const successfulRoles = roleResults.filter(r => r.status === 'completed').length;
    const successRate = (successfulRoles / totalRoles) * 100;

    return {
        summary: {
            title: 'Исполнительный отчет по демонстрации AI экосистемы 1С',
            demo_type: demo.type,
            overall_success: successRate >= 80,
            key_findings: [
                `Успешно выполнено ${successfulRoles} из ${totalRoles} ролей (${successRate.toFixed(1)}%)`,
                `Время выполнения: ${calculateDuration(demo.start_time, demo.end_time)}`,
                `Сложность: ${demo.complexity}`
            ]
        },
        sections: [
            {
                title: 'Обзор демонстрации',
                content: {
                    demo_id: demo.id,
                    type: demo.type,
                    complexity: demo.complexity,
                    roles: demo.roles,
                    duration: calculateDuration(demo.start_time, demo.end_time)
                }
            },
            {
                title: 'Результаты по ролям',
                content: roleResults.map(role => ({
                    role: role.role,
                    status: role.status,
                    execution_time: role.execution_time,
                    score: role.score || 'N/A'
                }))
            }
        ],
        conclusion: successRate >= 80 ? 
            'Демонстрация показала высокую эффективность AI экосистемы 1С. Рекомендуется к внедрению.' :
            'Требуются дополнительные улучшения системы. Смотрите технические рекомендации.'
    };
}

/**
 * Генерация технического отчета
 */
async function generateTechnicalReport(demo, roleResults, metrics) {
    return {
        summary: {
            title: 'Технический отчет по демонстрации',
            architecture_score: calculateArchitectureScore(roleResults),
            performance_metrics: calculatePerformanceMetrics(metrics)
        },
        sections: [
            {
                title: 'Техническая архитектура',
                content: {
                    services_involved: getAllServices(roleResults),
                    integration_points: analyzeIntegrationPoints(roleResults),
                    bottlenecks: identifyBottlenecks(metrics)
                }
            },
            {
                title: 'Детальные результаты',
                content: roleResults.map(role => ({
                    role: role.role,
                    technical_details: role.technical_details || {},
                    performance_data: role.performance_data || {},
                    issues: role.issues || []
                }))
            }
        ],
        conclusion: 'Техническая реализация соответствует требованиям с выявленными областями для оптимизации.'
    };
}

/**
 * Генерация отчета по производительности
 */
async function generatePerformanceReport(demo, roleResults, metrics) {
    return {
        summary: {
            title: 'Отчет по производительности',
            overall_performance: calculateOverallPerformance(metrics),
            response_times: getResponseTimeStats(metrics),
            resource_utilization: getResourceUtilization(metrics)
        },
        sections: [
            {
                title: 'Метрики производительности',
                content: metrics
            }
        ],
        conclusion: 'Система демонстрирует стабильную производительность в рамках ожидаемых параметров.'
    };
}

/**
 * Генерация комплексного отчета
 */
async function generateComprehensiveReport(demo, roleResults, metrics) {
    const execReport = await generateExecutiveReport(demo, roleResults, metrics);
    const techReport = await generateTechnicalReport(demo, roleResults, metrics);
    const perfReport = await generatePerformanceReport(demo, roleResults, metrics);

    return {
        summary: execReport.summary,
        sections: [
            ...execReport.sections,
            ...techReport.sections,
            ...perfReport.sections
        ],
        conclusion: execReport.conclusion
    };
}

/**
 * Генерация рекомендаций
 */
async function generateRecommendations(demo, roleResults, metrics) {
    const recommendations = [];

    // Анализ успешности ролей
    const failedRoles = roleResults.filter(r => r.status === 'failed');
    if (failedRoles.length > 0) {
        recommendations.push({
            category: 'Критические исправления',
            priority: 'Высокая',
            description: `Необходимо исправить проблемы в ролях: ${failedRoles.map(r => r.role).join(', ')}`,
            actions: failedRoles.map(r => `Анализ и исправление логики роли ${r.role}`)
        });
    }

    // Анализ производительности
    const slowResponses = metrics.filter(m => m.response_time > 5000);
    if (slowResponses.length > 0) {
        recommendations.push({
            category: 'Оптимизация производительности',
            priority: 'Средняя',
            description: 'Обнаружены медленные ответы системы',
            actions: [
                'Оптимизация запросов к базе данных',
                'Настройка кэширования',
                'Масштабирование сервисов'
            ]
        });
    }

    return recommendations;
}

/**
 * Вспомогательные функции
 */
function calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return 'N/A';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.round((end - start) / 1000);
    return `${Math.floor(duration / 60)}м ${duration % 60}с`;
}

function calculateArchitectureScore(roleResults) {
    const completedRoles = roleResults.filter(r => r.status === 'completed').length;
    return Math.round((completedRoles / roleResults.length) * 100);
}

function calculatePerformanceMetrics(metrics) {
    if (metrics.length === 0) return {};
    
    const avgResponseTime = metrics.reduce((sum, m) => sum + (m.response_time || 0), 0) / metrics.length;
    const maxResponseTime = Math.max(...metrics.map(m => m.response_time || 0));
    
    return {
        average_response_time: Math.round(avgResponseTime),
        max_response_time: maxResponseTime,
        total_requests: metrics.length
    };
}

function calculateOverallPerformance(metrics) {
    const avgResponseTime = metrics.reduce((sum, m) => sum + (m.response_time || 0), 0) / metrics.length;
    return avgResponseTime < 2000 ? 'Отличная' : avgResponseTime < 5000 ? 'Хорошая' : 'Требует улучшения';
}

function getResponseTimeStats(metrics) {
    if (metrics.length === 0) return {};
    
    const times = metrics.map(m => m.response_time || 0).sort((a, b) => a - b);
    return {
        min: Math.min(...times),
        max: Math.max(...times),
        avg: Math.round(times.reduce((sum, t) => sum + t, 0) / times.length),
        median: times[Math.floor(times.length / 2)]
    };
}

function getResourceUtilization(metrics) {
    return {
        cpu_usage: 'Анализ требует дополнительных метрик',
        memory_usage: 'Анализ требует дополнительных метрик',
        disk_io: 'Анализ требует дополнительных метрик'
    };
}

function getAllServices(roleResults) {
    const services = new Set();
    roleResults.forEach(role => {
        if (role.services_used) {
            role.services_used.forEach(service => services.add(service));
        }
    });
    return Array.from(services);
}

function analyzeIntegrationPoints(roleResults) {
    return {
        internal_integrations: 'Анализ требует детальных данных',
        external_integrations: 'Анализ требует детальных данных',
        api_endpoints: 'Анализ требует детальных данных'
    };
}

function identifyBottlenecks(metrics) {
    return metrics.filter(m => m.response_time > 10000).map(m => ({
        service: m.service,
        issue: 'Высокое время ответа',
        response_time: m.response_time
    }));
}

async function generateHTMLReport(report) {
    return {
        ...report,
        format: 'html',
        html_content: `
        <html>
        <head><title>Отчет ${report.type}</title></head>
        <body>
            <h1>${report.summary.title}</h1>
            <h2>Основные выводы</h2>
            <ul>
                ${report.summary.key_findings.map(finding => `<li>${finding}</li>`).join('')}
            </ul>
            <h2>Заключение</h2>
            <p>${report.conclusion}</p>
        </body>
        </html>
        `
    };
}

async function generatePDFData(report) {
    return {
        ...report,
        format: 'pdf',
        pdf_ready: true,
        print_sections: report.sections.map(section => ({
            title: section.title,
            content: JSON.stringify(section.content, null, 2)
        }))
    };
}