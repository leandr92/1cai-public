/**
 * Cron Job для автоматического обновления базы знаний its.1c.ru
 * Выполняется еженедельно по понедельникам в 02:00
 */

Deno.serve(async (req) => {
    try {
        console.log('Starting scheduled knowledge base update...');

        // Получаем конфигурацию
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Missing Supabase configuration');
        }

        // Проверяем, нужно ли обновление
        const statusCheck = await checkKnowledgeBaseUpdateStatus(supabaseUrl, serviceRoleKey);
        
        console.log('Current knowledge base status:', statusCheck);

        // Определяем категории для обновления
        const categoriesToUpdate = determinePriorityCategories(statusCheck);
        
        console.log('Categories to update:', categoriesToUpdate);

        if (categoriesToUpdate.length === 0) {
            console.log('No categories require updating. Skipping update.');
            return new Response(JSON.stringify({
                success: true,
                message: 'Knowledge base is up to date',
                skipped: true,
                status: statusCheck
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Выполняем обновление
        const updateResult = await triggerKnowledgeBaseUpdate(
            supabaseUrl,
            serviceRoleKey,
            categoriesToUpdate
        );

        console.log('Update completed:', updateResult);

        return new Response(JSON.stringify({
            success: true,
            message: 'Scheduled update completed',
            result: updateResult,
            status: statusCheck
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Scheduled update failed:', error);

        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

/**
 * Проверяет статус базы знаний для определения необходимости обновления
 */
async function checkKnowledgeBaseUpdateStatus(supabaseUrl: string, serviceRoleKey: string) {
    try {
        // Вызываем knowledge-base-updater для получения статуса
        const response = await fetch(`${supabaseUrl}/functions/v1/knowledge-base-updater`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'status' })
        });

        if (!response.ok) {
            throw new Error(`Status check failed: ${await response.text()}`);
        }

        const result = await response.json();
        return result.data || result;

    } catch (error) {
        console.error('Failed to check status:', error);
        
        // Возвращаем базовый статус в случае ошибки
        return {
            statistics: { total_records: 0, vectorized_records: 0 },
            recommendations: ['Status check failed'],
            requires_update: true
        };
    }
}

/**
 * Определяет приоритетные категории для обновления
 */
function determinePriorityCategories(statusCheck: any): string[] {
    const categories: string[] = [];
    const recommendations = statusCheck.recommendations || [];
    
    // Если есть рекомендации по обновлению, обновляем все категории
    if (recommendations.length > 0) {
        return ['documentation', 'api', 'examples', 'solutions', 'guides'];
    }
    
    // Проверяем статусы категорий
    const categoryStatuses = statusCheck.category_statuses || [];
    const staleThreshold = 7 * 24 * 60 * 60 * 1000; // 7 дней в миллисекундах
    const now = Date.now();
    
    for (const categoryStatus of categoryStatuses) {
        const lastUpdate = new Date(categoryStatus.last_update).getTime();
        if (now - lastUpdate > staleThreshold) {
            categories.push(categoryStatus.category);
        }
    }
    
    // Если нет устаревших категорий, но есть новые записи без векторизации
    const stats = statusCheck.statistics || {};
    if (stats.total_records > 0 && stats.vectorized_records < stats.total_records) {
        categories.push('documentation', 'api', 'examples'); // Приоритетные категории
    }
    
    return [...new Set(categories)]; // Удаляем дубликаты
}

/**
 * Запускает обновление базы знаний
 */
async function triggerKnowledgeBaseUpdate(
    supabaseUrl: string,
    serviceRoleKey: string,
    categories: string[]
) {
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/knowledge-base-updater`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'update_all',
                categories: categories,
                force_refresh: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Update failed: ${errorText}`);
        }

        const result = await response.json();
        return result.data || result;

    } catch (error) {
        console.error('Failed to trigger update:', error);
        throw error;
    }
}