/**
 * Edge Function: Экспорт и backup данных
 * Управляет экспортом данных, созданием резервных копий и восстановлением
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
            export_type,
            demo_id,
            backup_id,
            export_format = 'json',
            include_assets = true,
            compression = true,
            storage_provider = 'supabase'
        } = requestData;

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        let result = {};

        switch (action) {
            case 'create_backup':
                result = await createBackup(requestData, supabaseUrl, supabaseKey);
                break;
            case 'restore_backup':
                result = await restoreBackup(requestData, supabaseUrl, supabaseKey);
                break;
            case 'export_data':
                result = await exportData(requestData, supabaseUrl, supabaseKey);
                break;
            case 'list_backups':
                result = await listBackups(requestData, supabaseUrl, supabaseKey);
                break;
            case 'schedule_backup':
                result = await scheduleBackup(requestData, supabaseUrl, supabaseKey);
                break;
            case 'cleanup_old_backups':
                result = await cleanupOldBackups(requestData, supabaseUrl, supabaseKey);
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
        console.error('Export backup error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'EXPORT_BACKUP_ERROR',
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
 * Создание резервной копии
 */
async function createBackup(requestData, supabaseUrl, supabaseKey) {
    const { 
        backup_type = 'full',
        demo_id,
        include_logs = true,
        include_metrics = true,
        encryption = true,
        retention_days = 30
    } = requestData;

    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Создаем запись о backup
    const backupRecord = {
        id: backupId,
        type: backup_type,
        demo_id: demo_id || null,
        status: 'in_progress',
        created_at: new Date().toISOString(),
        include_logs: include_logs,
        include_metrics: include_metrics,
        encrypted: encryption,
        retention_days: retention_days,
        size_bytes: 0
    };

    // Сохраняем запись
    const backupResponse = await fetch(`${supabaseUrl}/rest/v1/backups`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(backupRecord)
    });

    const [backup] = await backupResponse.json();

    try {
        // Экспортируем данные в зависимости от типа
        let exportedData = {};

        if (backup_type === 'demo' && demo_id) {
            exportedData = await exportDemoData(demo_id, include_logs, include_metrics, supabaseUrl, supabaseKey);
        } else {
            exportedData = await exportAllData(include_logs, include_metrics, supabaseUrl, supabaseKey);
        }

        // Сжимаем данные если требуется
        if (compression) {
            exportedData = await compressData(exportedData);
        }

        // Шифруем данные если требуется
        if (encryption) {
            exportedData = await encryptData(exportedData, backupId);
        }

        // Сохраняем в хранилище
        const storagePath = await saveToStorage(exportedData, backupId, storage_provider, supabaseUrl, supabaseKey);

        // Вычисляем размер
        const sizeBytes = JSON.stringify(exportedData).length;

        // Обновляем статус backup
        await fetch(`${supabaseUrl}/rest/v1/backups?id=eq.${backupId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'completed',
                completed_at: new Date().toISOString(),
                storage_path: storagePath,
                size_bytes: sizeBytes,
                checksum: await calculateChecksum(exportedData)
            })
        });

        return {
            backup: {
                ...backup,
                status: 'completed',
                completed_at: new Date().toISOString(),
                storage_path: storagePath,
                size_bytes: sizeBytes
            },
            message: 'Резервная копия успешно создана',
            storage_path: storagePath,
            size_mb: (sizeBytes / (1024 * 1024)).toFixed(2)
        };

    } catch (error) {
        // Обновляем статус с ошибкой
        await fetch(`${supabaseUrl}/rest/v1/backups?id=eq.${backupId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'failed',
                error: error.message,
                completed_at: new Date().toISOString()
            })
        });

        throw error;
    }
}

/**
 * Восстановление из резервной копии
 */
async function restoreBackup(requestData, supabaseUrl, supabaseKey) {
    const { 
        backup_id,
        restore_type = 'partial',
        overwrite_existing = false,
        validate_checksum = true
    } = requestData;

    // Получаем информацию о backup
    const backupResponse = await fetch(`${supabaseUrl}/rest/v1/backups?id=eq.${backup_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        }
    });

    if (!backupResponse.ok) {
        throw new Error('Backup not found');
    }

    const backups = await backupResponse.json();
    if (backups.length === 0) {
        throw new Error('Backup not found');
    }

    const backup = backups[0];

    if (backup.status !== 'completed') {
        throw new Error('Cannot restore incomplete backup');
    }

    // Загружаем данные из хранилища
    const backupData = await loadFromStorage(backup.storage_path, supabaseUrl, supabaseKey);

    // Расшифровываем если нужно
    let restoredData = backupData;
    if (backup.encrypted) {
        restoredData = await decryptData(backupData, backup_id);
    }

    // Распаковываем если нужно
    if (compression && backup.compressed) {
        restoredData = await decompressData(restoredData);
    }

    // Проверяем checksum
    if (validate_checksum && backup.checksum) {
        const calculatedChecksum = await calculateChecksum(restoredData);
        if (calculatedChecksum !== backup.checksum) {
            throw new Error('Backup checksum validation failed');
        }
    }

    // Создаем запись о восстановлении
    const restoreRecord = {
        id: `restore_${Date.now()}`,
        backup_id: backup_id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        restore_type: restore_type,
        overwrite_existing: overwrite_existing
    };

    await fetch(`${supabaseUrl}/rest/v1/restores`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(restoreRecord)
    });

    try {
        // Восстанавливаем данные
        const restoreResult = await performRestore(restoredData, restore_type, overwrite_existing, supabaseUrl, supabaseKey);

        return {
            backup_id: backup_id,
            restore_type: restore_type,
            success: true,
            restored_items: restoreResult.restored_items,
            failed_items: restoreResult.failed_items,
            message: 'Восстановление завершено успешно'
        };

    } catch (error) {
        return {
            backup_id: backup_id,
            restore_type: restore_type,
            success: false,
            error: error.message,
            message: 'Ошибка при восстановлении'
        };
    }
}

/**
 * Экспорт данных
 */
async function exportData(requestData, supabaseUrl, supabaseKey) {
    const { 
        export_type,
        demo_id,
        format = 'json',
        include_metadata = true,
        date_range
    } = requestData;

    let exportData = {};

    switch (export_type) {
        case 'demo':
            if (!demo_id) {
                throw new Error('demo_id is required for demo export');
            }
            exportData = await exportDemoData(demo_id, true, true, supabaseUrl, supabaseKey);
            break;
        case 'reports':
            exportData = await exportReports(date_range, supabaseUrl, supabaseKey);
            break;
        case 'metrics':
            exportData = await exportMetrics(date_range, supabaseUrl, supabaseKey);
            break;
        case 'logs':
            exportData = await exportLogs(date_range, supabaseUrl, supabaseKey);
            break;
        default:
            exportData = await exportAllData(true, true, supabaseUrl, supabaseKey);
    }

    // Форматируем данные
    let formattedData = exportData;
    if (format === 'csv') {
        formattedData = await convertToCSV(exportData, export_type);
    } else if (format === 'xml') {
        formattedData = await convertToXML(exportData, export_type);
    }

    // Добавляем метаданные
    if (include_metadata) {
        formattedData = {
            metadata: {
                export_type: export_type,
                exported_at: new Date().toISOString(),
                format: format,
                record_count: calculateRecordCount(exportData),
                version: '1.0'
            },
            data: formattedData
        };
    }

    // Сохраняем экспорт
    const exportRecord = {
        id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        export_type: export_type,
        demo_id: demo_id || null,
        format: format,
        created_at: new Date().toISOString(),
        record_count: calculateRecordCount(exportData)
    };

    await fetch(`${supabaseUrl}/rest/v1/exports`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportRecord)
    });

    return {
        export_id: exportRecord.id,
        export_type: export_type,
        format: format,
        data: formattedData,
        metadata: formattedData.metadata,
        record_count: calculateRecordCount(exportData),
        size_bytes: JSON.stringify(formattedData).length
    };
}

/**
 * Список резервных копий
 */
async function listBackups(requestData, supabaseUrl, supabaseKey) {
    const { 
        backup_type,
        limit = 20,
        status,
        date_from,
        date_to
    } = requestData;

    let query = `${supabaseUrl}/rest/v1/backups?select=*`;
    
    if (backup_type) {
        query += `&type=eq.${backup_type}`;
    }
    
    if (status) {
        query += `&status=eq.${status}`;
    }
    
    if (date_from) {
        query += `&created_at=gte.${date_from}`;
    }
    
    if (date_to) {
        query += `&created_at=lte.${date_to}`;
    }
    
    query += `&order=created_at.desc&limit=${limit}`;

    const response = await fetch(query, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch backups');
    }

    const backups = await response.json();

    return {
        backups: backups.map(backup => ({
            ...backup,
            size_mb: backup.size_bytes ? (backup.size_bytes / (1024 * 1024)).toFixed(2) : null,
            age_hours: backup.created_at ? Math.round((Date.now() - new Date(backup.created_at).getTime()) / (1000 * 60 * 60)) : null
        })),
        total: backups.length
    };
}

/**
 * Планирование резервного копирования
 */
async function scheduleBackup(requestData, supabaseUrl, supabaseKey) {
    const { 
        schedule_type,
        backup_frequency,
        retention_days = 30,
        backup_types = ['incremental'],
        notification_settings = {}
    } = requestData;

    const schedule = {
        id: `backup_schedule_${Date.now()}`,
        schedule_type: schedule_type,
        backup_frequency: backup_frequency,
        retention_days: retention_days,
        backup_types: backup_types,
        notification_settings: notification_settings,
        status: 'active',
        created_at: new Date().toISOString(),
        next_execution: calculateNextBackupExecution(backup_frequency)
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/backup_schedules`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(schedule)
    });

    const [createdSchedule] = await response.json();

    return {
        schedule: createdSchedule,
        message: 'Планирование резервного копирования настроено',
        next_execution: schedule.next_execution
    };
}

/**
 * Очистка старых резервных копий
 */
async function cleanupOldBackups(requestData, supabaseUrl, supabaseKey) {
    const { 
        retention_days = 30,
        dry_run = true,
        backup_types = []
    } = requestData;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retention_days);

    let query = `${supabaseUrl}/rest/v1/backups?created_at=lt.${cutoffDate.toISOString()}`;
    
    if (backup_types.length > 0) {
        query += `&type=in.(${backup_types.join(',')})`;
    }

    const response = await fetch(query, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch old backups');
    }

    const oldBackups = await response.json();

    let deletedCount = 0;
    let errors = [];

    if (!dry_run) {
        for (const backup of oldBackups) {
            try {
                // Удаляем из хранилища
                await deleteFromStorage(backup.storage_path, supabaseUrl, supabaseKey);
                
                // Удаляем запись из БД
                await fetch(`${supabaseUrl}/rest/v1/backups?id=eq.${backup.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                deletedCount++;
            } catch (error) {
                errors.push({
                    backup_id: backup.id,
                    error: error.message
                });
            }
        }
    }

    return {
        dry_run: dry_run,
        retention_days: retention_days,
        found_backups: oldBackups.length,
        deleted_count: deletedCount,
        errors: errors,
        freed_space_mb: oldBackups.reduce((sum, backup) => sum + (backup.size_bytes || 0), 0) / (1024 * 1024),
        message: dry_run ? 
            `Найдено ${oldBackups.length} старых резервных копий для удаления` :
            `Удалено ${deletedCount} старых резервных копий`
    };
}

/**
 * Вспомогательные функции для экспорта
 */
async function exportDemoData(demoId, includeLogs, includeMetrics, supabaseUrl, supabaseKey) {
    const data = {};

    // Основные данные демонстрации
    const demoResponse = await fetch(`${supabaseUrl}/rest/v1/demos?id=eq.${demoId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        }
    });

    if (demoResponse.ok) {
        data.demo = (await demoResponse.json())[0];
    }

    // Результаты по ролям
    const rolesResponse = await fetch(`${supabaseUrl}/rest/v1/demo_roles?demo_id=eq.${demoId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        }
    });

    if (rolesResponse.ok) {
        data.roles = await rolesResponse.json();
    }

    // Логи если нужно
    if (includeLogs) {
        const logsResponse = await fetch(`${supabaseUrl}/rest/v1/demo_logs?demo_id=eq.${demoId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            }
        });

        if (logsResponse.ok) {
            data.logs = await logsResponse.json();
        }
    }

    // Метрики если нужно
    if (includeMetrics) {
        const metricsResponse = await fetch(`${supabaseUrl}/rest/v1/demo_metrics?demo_id=eq.${demoId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            }
        });

        if (metricsResponse.ok) {
            data.metrics = await metricsResponse.json();
        }
    }

    return data;
}

async function exportAllData(includeLogs, includeMetrics, supabaseUrl, supabaseKey) {
    const data = {};

    // Все демонстрации
    const demosResponse = await fetch(`${supabaseUrl}/rest/v1/demos?order=created_at.desc&limit=100`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        }
    });

    if (demosResponse.ok) {
        data.demos = await demosResponse.json();
    }

    // Все отчеты
    const reportsResponse = await fetch(`${supabaseUrl}/rest/v1/demo_reports?order=created_at.desc&limit=100`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        }
    });

    if (reportsResponse.ok) {
        data.reports = await reportsResponse.json();
    }

    // Другие данные по требованию
    if (includeLogs) {
        // Добавить экспорт логов
    }

    if (includeMetrics) {
        // Добавить экспорт метрик
    }

    return data;
}

async function exportReports(dateRange, supabaseUrl, supabaseKey) {
    let query = `${supabaseUrl}/rest/v1/demo_reports?order=created_at.desc`;
    
    if (dateRange?.from) {
        query += `&created_at=gte.${dateRange.from}`;
    }
    
    if (dateRange?.to) {
        query += `&created_at=lte.${dateRange.to}`;
    }

    const response = await fetch(query, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        }
    });

    return response.ok ? { reports: await response.json() } : { reports: [] };
}

async function exportMetrics(dateRange, supabaseUrl, supabaseKey) {
    let query = `${supabaseUrl}/rest/v1/demo_metrics?order=timestamp.desc`;
    
    if (dateRange?.from) {
        query += `&timestamp=gte.${dateRange.from}`;
    }
    
    if (dateRange?.to) {
        query += `&timestamp=lte.${dateRange.to}`;
    }

    const response = await fetch(query, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        }
    });

    return response.ok ? { metrics: await response.json() } : { metrics: [] };
}

async function exportLogs(dateRange, supabaseUrl, supabaseKey) {
    let query = `${supabaseUrl}/rest/v1/demo_logs?order=timestamp.desc`;
    
    if (dateRange?.from) {
        query += `&timestamp=gte.${dateRange.from}`;
    }
    
    if (dateRange?.to) {
        query += `&timestamp=lte.${dateRange.to}`;
    }

    const response = await fetch(query, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        }
    });

    return response.ok ? { logs: await response.json() } : { logs: [] };
}

/**
 * Утилиты для работы с данными
 */
async function compressData(data) {
    // Простое сжатие - в реальности можно использовать gzip или другие алгоритмы
    const jsonString = JSON.stringify(data);
    return {
        compressed: true,
        data: jsonString,
        original_size: jsonString.length,
        compressed_size: jsonString.length // Упрощено для примера
    };
}

async function encryptData(data, backupId) {
    // Простое "шифрование" - в реальности используйте proper encryption
    const jsonString = JSON.stringify(data);
    const encrypted = btoa(jsonString + backupId); // Base64 для примера
    return {
        encrypted: true,
        data: encrypted,
        encryption_method: 'base64'
    };
}

async function decompressData(compressedData) {
    return JSON.parse(compressedData.data);
}

async function decryptData(encryptedData, backupId) {
    try {
        const decrypted = atob(encryptedData.data);
        const expectedSuffix = backupId;
        if (!decrypted.endsWith(expectedSuffix)) {
            throw new Error('Invalid backup ID or corrupted data');
        }
        return JSON.parse(decrypted.slice(0, -expectedSuffix.length));
    } catch (error) {
        throw new Error('Failed to decrypt backup data');
    }
}

async function saveToStorage(data, backupId, provider, supabaseUrl, supabaseKey) {
    if (provider === 'supabase') {
        const fileName = `backups/${backupId}.json`;
        
        // Сохраняем в Supabase Storage
        const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/backups/${fileName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!uploadResponse.ok) {
            throw new Error('Failed to save backup to storage');
        }

        return `backups/${fileName}`;
    }

    // Другие провайдеры (AWS S3, Google Cloud, etc.)
    throw new Error(`Storage provider ${provider} not implemented`);
}

async function loadFromStorage(storagePath, supabaseUrl, supabaseKey) {
    const downloadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${storagePath}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
        }
    });

    if (!downloadResponse.ok) {
        throw new Error('Failed to load backup from storage');
    }

    return await downloadResponse.json();
}

async function deleteFromStorage(storagePath, supabaseUrl, supabaseKey) {
    await fetch(`${supabaseUrl}/storage/v1/object/${storagePath}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
        }
    });
}

async function calculateChecksum(data) {
    const jsonString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
}

function calculateRecordCount(data) {
    if (typeof data !== 'object' || data === null) return 0;
    
    let count = 0;
    for (const key in data) {
        if (Array.isArray(data[key])) {
            count += data[key].length;
        } else if (typeof data[key] === 'object') {
            count += calculateRecordCount(data[key]);
        }
    }
    return count;
}

function calculateNextBackupExecution(frequency) {
    const now = new Date();
    
    switch (frequency) {
        case 'daily':
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(2, 0, 0, 0);
            return tomorrow.toISOString();
        
        case 'weekly':
            const nextWeek = new Date(now);
            nextWeek.setDate(nextWeek.getDate() + 7);
            nextWeek.setHours(2, 0, 0, 0);
            return nextWeek.toISOString();
        
        case 'monthly':
            const nextMonth = new Date(now);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextMonth.setHours(2, 0, 0, 0);
            return nextMonth.toISOString();
        
        default:
            const hourLater = new Date(now.getTime() + 3600000);
            return hourLater.toISOString();
    }
}

async function convertToCSV(data, exportType) {
    // Упрощенная конвертация в CSV
    const rows = [];
    
    if (exportType === 'reports' && data.reports) {
        for (const report of data.reports) {
            rows.push({
                id: report.id,
                demo_id: report.demo_id,
                type: report.type,
                created_at: report.created_at,
                summary: report.summary?.title || ''
            });
        }
    }
    
    return { csv_data: rows };
}

async function convertToXML(data, exportType) {
    // Упрощенная конвертация в XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>';
    
    if (exportType === 'reports' && data.reports) {
        for (const report of data.reports) {
            xml += `<report id="${report.id}">`;
            xml += `<demoId>${report.demo_id || ''}</demoId>`;
            xml += `<type>${report.type || ''}</type>`;
            xml += `<createdAt>${report.created_at || ''}</createdAt>`;
            xml += `</report>`;
        }
    }
    
    xml += '</data>';
    return { xml_data: xml };
}

async function performRestore(data, restoreType, overwriteExisting, supabaseUrl, supabaseKey) {
    const restoredItems = [];
    const failedItems = [];

    try {
        if (data.demo) {
            // Восстанавливаем демонстрацию
            try {
                await restoreDemoData(data.demo, data.roles || [], overwriteExisting, supabaseUrl, supabaseKey);
                restoredItems.push(`demo:${data.demo.id}`);
            } catch (error) {
                failedItems.push(`demo:${data.demo.id} - ${error.message}`);
            }
        }

        return {
            restored_items: restoredItems,
            failed_items: failedItems
        };

    } catch (error) {
        throw new Error(`Restore failed: ${error.message}`);
    }
}

async function restoreDemoData(demo, roles, overwrite, supabaseUrl, supabaseKey) {
    // Восстанавливаем основные данные демонстрации
    const demoData = { ...demo };
    delete demoData.id; // Удаляем ID для создания новой записи

    const response = await fetch(`${supabaseUrl}/rest/v1/demos`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(demoData)
    });

    if (!response.ok) {
        throw new Error('Failed to restore demo data');
    }

    const restoredDemo = (await response.json())[0];

    // Восстанавливаем данные по ролям
    for (const role of roles) {
        const roleData = { ...role, demo_id: restoredDemo.id };
        delete roleData.id;

        await fetch(`${supabaseUrl}/rest/v1/demo_roles`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(roleData)
        });
    }
}