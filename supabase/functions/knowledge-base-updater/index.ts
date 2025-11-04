/**
 * Edge Function для управления обновлениями базы знаний its.1c.ru
 * Автоматически отслеживает изменения и обновляет контент
 */

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { action, categories, force_refresh = false } = await req.json();

        // Получаем конфигурацию
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Missing Supabase configuration');
        }

        let result = null;

        switch (action) {
            case 'update_all':
                result = await updateAllKnowledgeBase(supabaseUrl, serviceRoleKey, categories, force_refresh);
                break;
            case 'check_updates':
                result = await checkForUpdates(supabaseUrl, serviceRoleKey);
                break;
            case 'status':
                result = await getUpdateStatus(supabaseUrl, serviceRoleKey);
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Knowledge base updater error:', error);

        const errorResponse = {
            error: {
                code: 'KNOWLEDGE_BASE_UPDATE_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

/**
 * Обновляет всю базу знаний
 */
async function updateAllKnowledgeBase(
    supabaseUrl: string,
    serviceRoleKey: string,
    categories?: string[],
    force_refresh = false
) {
    // Определяем категории для обновления
    const categoriesToUpdate = categories || [
        'documentation',
        'api',
        'examples',
        'solutions',
        'guides'
    ];

    const updateId = crypto.randomUUID();
    
    // Создаем запись о начале обновления
    await createUpdateRecord(supabaseUrl, serviceRoleKey, {
        id: updateId,
        update_type: 'full_update',
        status: 'in_progress',
        metadata: { categories: categoriesToUpdate, force_refresh }
    });

    let totalProcessed = 0;
    let totalUpdated = 0;
    const results = [];

    for (const category of categoriesToUpdate) {
        try {
            // Получаем существующие записи категории
            const existingRecords = await getExistingRecords(supabaseUrl, serviceRoleKey, category);
            
            // Определяем URL для парсинга категории
            const categoryUrls = getCategoryUrls(category);
            
            for (const url of categoryUrls) {
                try {
                    // Парсим контент
                    const parseResult = await parseCategoryContent(
                        supabaseUrl, 
                        serviceRoleKey, 
                        url, 
                        category,
                        force_refresh
                    );
                    
                    if (parseResult.success) {
                        totalProcessed++;
                        totalUpdated += parseResult.records_updated || 0;
                        
                        results.push({
                            url,
                            category,
                            success: true,
                            records_updated: parseResult.records_updated || 0
                        });
                    } else {
                        results.push({
                            url,
                            category,
                            success: false,
                            error: parseResult.error
                        });
                    }
                    
                    // Небольшая задержка между запросами
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (urlError) {
                    results.push({
                        url,
                        category,
                        success: false,
                        error: urlError.message
                    });
                }
            }
            
        } catch (categoryError) {
            console.error(`Error updating category ${category}:`, categoryError);
            results.push({
                category,
                success: false,
                error: categoryError.message
            });
        }
    }

    // Обновляем статус завершения
    await updateUpdateRecord(supabaseUrl, serviceRoleKey, updateId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        records_processed: totalProcessed,
        records_updated: totalUpdated,
        metadata: { results, final_categories: categoriesToUpdate }
    });

    return {
        update_id: updateId,
        total_processed: totalProcessed,
        total_updated: totalUpdated,
        results: results,
        completed_at: new Date().toISOString()
    };
}

/**
 * Проверяет наличие обновлений на сайте
 */
async function checkForUpdates(supabaseUrl: string, serviceRoleKey: string) {
    const lastUpdate = await getLastUpdate(supabaseUrl, serviceRoleKey);
    
    const updateCheck = {
        last_update: lastUpdate,
        new_content_available: false,
        recommendations: []
    };

    if (!lastUpdate) {
        updateCheck.recommendations.push('База знаний еще не обновлялась. Рекомендуется выполнить первоначальное обновление.');
        return updateCheck;
    }

    // Проверяем давность последнего обновления
    const hoursSinceUpdate = (Date.now() - new Date(lastUpdate.completed_at).getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate > 168) { // Неделя
        updateCheck.recommendations.push('Последнее обновление было более недели назад. Рекомендуется обновить базу знаний.');
    }

    // Проверяем статус предыдущих обновлений
    const recentUpdates = await getRecentUpdates(supabaseUrl, serviceRoleKey, 3);
    const failedUpdates = recentUpdates.filter(u => u.status === 'failed');
    
    if (failedUpdates.length > 0) {
        updateCheck.recommendations.push(`Обнаружено ${failedUpdates.length} неудачных обновлений. Проверьте логи для устранения проблем.`);
    }

    // Определяем приоритетные категории для обновления
    const categoryStatuses = await checkCategoryStatuses(supabaseUrl, serviceRoleKey);
    const staleCategories = categoryStatuses.filter(cs => 
        cs.last_update && 
        (Date.now() - new Date(cs.last_update).getTime()) / (1000 * 60 * 60 * 24) > 7
    );

    if (staleCategories.length > 0) {
        updateCheck.recommendations.push(
            `Следующие категории не обновлялись более недели: ${staleCategories.map(c => c.category).join(', ')}`
        );
    }

    return updateCheck;
}

/**
 * Получает статус обновлений
 */
async function getUpdateStatus(supabaseUrl: string, serviceRoleKey: string) {
    const recentUpdates = await getRecentUpdates(supabaseUrl, serviceRoleKey, 10);
    const categoryStatuses = await checkCategoryStatuses(supabaseUrl, serviceRoleKey);
    
    const totalRecords = await getTotalKnowledgeBaseRecords(supabaseUrl, serviceRoleKey);
    const vectorizedRecords = await getVectorizedRecords(supabaseUrl, serviceRoleKey);

    return {
        recent_updates: recentUpdates,
        category_statuses: categoryStatuses,
        statistics: {
            total_records: totalRecords,
            vectorized_records: vectorizedRecords,
            completion_percentage: totalRecords > 0 ? 
                Math.round((vectorizedRecords / totalRecords) * 100) : 0
        }
    };
}

/**
 * Создает запись о начале обновления
 */
async function createUpdateRecord(
    supabaseUrl: string,
    serviceRoleKey: string,
    updateData: any
) {
    const response = await fetch(`${supabaseUrl}/rest/v1/knowledge_base_updates`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });

    if (!response.ok) {
        throw new Error(`Failed to create update record: ${await response.text()}`);
    }
}

/**
 * Обновляет запись об обновлении
 */
async function updateUpdateRecord(
    supabaseUrl: string,
    serviceRoleKey: string,
    updateId: string,
    updates: any
) {
    const response = await fetch(`${supabaseUrl}/rest/v1/knowledge_base_updates?id=eq.${updateId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
    });

    if (!response.ok) {
        throw new Error(`Failed to update record: ${await response.text()}`);
    }
}

/**
 * Получает существующие записи категории
 */
async function getExistingRecords(
    supabaseUrl: string,
    serviceRoleKey: string,
    category: string
) {
    const response = await fetch(
        `${supabaseUrl}/rest/v1/its_1c_knowledge_base?category=eq.${category}&select=id,content_hash,updated_at`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to get existing records: ${await response.text()}`);
    }

    return await response.json();
}

/**
 * Получает URL для категории
 */
function getCategoryUrls(category: string): string[] {
    const baseUrl = 'https://its.1c.ru';
    
    const categoryUrls = {
        'documentation': [
            `${baseUrl}/docs/`,
            `${baseUrl}/docs/platform/`,
            `${baseUrl}/docs/database/`
        ],
        'api': [
            `${baseUrl}/docs/api/`,
            `${baseUrl}/docs/http-services/`,
            `${baseUrl}/docs/odata/`
        ],
        'examples': [
            `${baseUrl}/code/`,
            `${baseUrl}/examples/`,
            `${baseUrl}/samples/`
        ],
        'solutions': [
            `${baseUrl}/solutions/`,
            `${baseUrl}/patterns/`,
            `${baseUrl}/best-practices/`
        ],
        'guides': [
            `${baseUrl}/guide/`,
            `${baseUrl}/tutorials/`,
            `${baseUrl}/how-to/`
        ]
    };

    return categoryUrls[category] || [`${baseUrl}/docs/`];
}

/**
 * Парсит контент категории
 */
async function parseCategoryContent(
    supabaseUrl: string,
    serviceRoleKey: string,
    url: string,
    category: string,
    force_refresh: boolean
) {
    // Получаем первого пользователя с сохраненными учетными данными
    const userResponse = await fetch(
        `${supabaseUrl}/rest/v1/encrypted_credentials?service_name=eq.its.1c.ru&is_active=eq.true&select=user_id&limit=1`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        }
    );

    if (!userResponse.ok) {
        throw new Error('No users with ITS credentials found');
    }

    const users = await userResponse.json();
    if (users.length === 0) {
        throw new Error('No active ITS credentials found');
    }

    const userId = users[0].user_id;

    // Вызываем парсер
    const parseResponse = await fetch(`${supabaseUrl}/functions/v1/its-1c-parser`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url,
            category,
            force_refresh,
            user_id: userId
        })
    });

    if (!parseResponse.ok) {
        const errorText = await parseResponse.text();
        throw new Error(`Parse failed: ${errorText}`);
    }

    return await parseResponse.json();
}

/**
 * Получает последнее обновление
 */
async function getLastUpdate(supabaseUrl: string, serviceRoleKey: string) {
    const response = await fetch(
        `${supabaseUrl}/rest/v1/knowledge_base_updates?status=eq.completed&order=completed_at.desc&limit=1`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to get last update: ${await response.text()}`);
    }

    const updates = await response.json();
    return updates.length > 0 ? updates[0] : null;
}

/**
 * Получает недавние обновления
 */
async function getRecentUpdates(
    supabaseUrl: string,
    serviceRoleKey: string,
    limit: number
) {
    const response = await fetch(
        `${supabaseUrl}/rest/v1/knowledge_base_updates?order=started_at.desc&limit=${limit}`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to get recent updates: ${await response.text()}`);
    }

    return await response.json();
}

/**
 * Проверяет статусы категорий
 */
async function checkCategoryStatuses(supabaseUrl: string, serviceRoleKey: string) {
    const response = await fetch(
        `${supabaseUrl}/rest/v1/its_1c_knowledge_base?select=category,updated_at&order=category,updated_at.desc`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to get category statuses: ${await response.text()}`);
    }

    const records = await response.json();
    const categoryMap = new Map();

    records.forEach(record => {
        if (!categoryMap.has(record.category) || 
            new Date(record.updated_at) > new Date(categoryMap.get(record.category))) {
            categoryMap.set(record.category, record.updated_at);
        }
    });

    return Array.from(categoryMap.entries()).map(([category, updated_at]) => ({
        category,
        last_update: updated_at
    }));
}

/**
 * Получает общее количество записей в базе знаний
 */
async function getTotalKnowledgeBaseRecords(supabaseUrl: string, serviceRoleKey: string) {
    const response = await fetch(
        `${supabaseUrl}/rest/v1/its_1c_knowledge_base?select=count`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Prefer': 'count=exact'
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to get count: ${await response.text()}`);
    }

    const countHeader = response.headers.get('Content-Range');
    return countHeader ? parseInt(countHeader.split('/')[1]) : 0;
}

/**
 * Получает количество векторизованных записей
 */
async function getVectorizedRecords(supabaseUrl: string, serviceRoleKey: string) {
    const response = await fetch(
        `${supabaseUrl}/rest/v1/its_1c_knowledge_base?select=count&embedding=not.is.null`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Prefer': 'count=exact'
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to get vectorized count: ${await response.text()}`);
    }

    const countHeader = response.headers.get('Content-Range');
    return countHeader ? parseInt(countHeader.split('/')[1]) : 0;
}