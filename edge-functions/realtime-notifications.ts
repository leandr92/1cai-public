/**
 * Edge Function: Real-time уведомления
 * Управляет отправкой уведомлений в реальном времени через различные каналы
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
            notification_type,
            recipients,
            channels = ['web'],
            data = {},
            priority = 'normal'
        } = requestData;

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        let result = {};

        switch (action) {
            case 'send_notification':
                result = await sendNotification(requestData, supabaseUrl, supabaseKey);
                break;
            case 'broadcast':
                result = await broadcastMessage(requestData, supabaseUrl, supabaseKey);
                break;
            case 'schedule_notification':
                result = await scheduleNotification(requestData, supabaseUrl, supabaseKey);
                break;
            case 'setup_webhook':
                result = await setupWebhook(requestData, supabaseUrl, supabaseKey);
                break;
            case 'get_notification_history':
                result = await getNotificationHistory(requestData, supabaseUrl, supabaseKey);
                break;
            case 'manage_subscriptions':
                result = await manageSubscriptions(requestData, supabaseUrl, supabaseKey);
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
        console.error('Real-time notification error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'NOTIFICATION_ERROR',
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
 * Отправка уведомления
 */
async function sendNotification(requestData, supabaseUrl, supabaseKey) {
    const { 
        notification_type,
        recipients,
        title,
        message,
        channels = ['web'],
        data = {},
        priority = 'normal',
        demo_id,
        user_id
    } = requestData;

    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Создаем уведомление
    const notification = {
        id: notificationId,
        type: notification_type,
        title: title,
        message: message,
        data: data,
        priority: priority,
        demo_id: demo_id || null,
        user_id: user_id || null,
        channels: channels,
        status: 'pending',
        created_at: new Date().toISOString(),
        scheduled_at: null
    };

    // Сохраняем уведомление в базу данных
    const notificationResponse = await fetch(`${supabaseUrl}/rest/v1/notifications`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(notification)
    });

    const [savedNotification] = await notificationResponse.json();

    // Отправляем через каждый канал
    const deliveryResults = [];
    
    for (const channel of channels) {
        try {
            const deliveryResult = await sendThroughChannel(
                channel, 
                savedNotification, 
                recipients, 
                supabaseUrl, 
                supabaseKey
            );
            deliveryResults.push({
                channel: channel,
                success: deliveryResult.success,
                result: deliveryResult,
                sent_at: new Date().toISOString()
            });
        } catch (error) {
            deliveryResults.push({
                channel: channel,
                success: false,
                error: error.message,
                sent_at: new Date().toISOString()
            });
        }
    }

    // Обновляем статус уведомления
    const allSuccessful = deliveryResults.every(r => r.success);
    await fetch(`${supabaseUrl}/rest/v1/notifications?id=eq.${notificationId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: allSuccessful ? 'sent' : 'partial',
            sent_at: new Date().toISOString(),
            delivery_results: deliveryResults
        })
    });

    // Отправляем через WebSocket для real-time обновлений
    await broadcastToWebSockets({
        type: 'notification',
        notification: savedNotification,
        delivery_results: deliveryResults
    }, supabaseUrl, supabaseKey);

    return {
        notification: savedNotification,
        delivery_results: deliveryResults,
        success: allSuccessful,
        total_recipients: recipients.length,
        successful_deliveries: deliveryResults.filter(r => r.success).length
    };
}

/**
 * Широковещательное сообщение
 */
async function broadcastMessage(requestData, supabaseUrl, supabaseKey) {
    const { 
        message,
        title,
        broadcast_type = 'system',
        include_offline = false,
        data = {},
        channels = ['web', 'email']
    } = requestData;

    // Получаем всех активных пользователей
    let recipientsQuery = `${supabaseUrl}/rest/v1/profiles?select=id,email&status=eq.active`;
    
    if (!include_offline) {
        recipientsQuery += '&last_seen=gte.' + new Date(Date.now() - 24*60*60*1000).toISOString();
    }

    const recipientsResponse = await fetch(recipientsQuery, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        }
    });

    const recipients = recipientsResponse.ok ? await recipientsResponse.json() : [];

    // Создаем broadcast запись
    const broadcastId = `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const broadcast = {
        id: broadcastId,
        type: broadcast_type,
        title: title,
        message: message,
        data: data,
        channels: channels,
        recipient_count: recipients.length,
        status: 'in_progress',
        created_at: new Date().toISOString(),
        sent_at: null
    };

    await fetch(`${supabaseUrl}/rest/v1/broadcasts`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(broadcast)
    });

    // Отправляем индивидуальные уведомления
    const batchSize = 100; // Отправляем батчами для избежания перегрузки
    const batches = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
        batches.push(recipients.slice(i, i + batchSize));
    }

    let totalSent = 0;
    let totalFailed = 0;

    for (const batch of batches) {
        const batchPromises = batch.map(async (recipient) => {
            try {
                await sendNotification({
                    notification_type: 'broadcast',
                    recipients: [recipient],
                    title: title,
                    message: message,
                    channels: channels,
                    data: data,
                    priority: 'normal',
                    broadcast_id: broadcastId
                }, supabaseUrl, supabaseKey);
                return { success: true, recipient: recipient.id };
            } catch (error) {
                return { success: false, recipient: recipient.id, error: error.message };
            }
        });

        const batchResults = await Promise.all(batchPromises);
        totalSent += batchResults.filter(r => r.success).length;
        totalFailed += batchResults.filter(r => !r.success).length;

        // Небольшая пауза между батчами
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Обновляем статус broadcast
    await fetch(`${supabaseUrl}/rest/v1/broadcasts?id=eq.${broadcastId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: totalFailed === 0 ? 'completed' : 'completed_with_errors',
            sent_at: new Date().toISOString(),
            recipient_count: recipients.length,
            successful_count: totalSent,
            failed_count: totalFailed
        })
    });

    // Отправляем через WebSocket
    await broadcastToWebSockets({
        type: 'broadcast',
        broadcast: broadcast,
        stats: {
            total: recipients.length,
            sent: totalSent,
            failed: totalFailed
        }
    }, supabaseUrl, supabaseKey);

    return {
        broadcast_id: broadcastId,
        recipient_count: recipients.length,
        sent_count: totalSent,
        failed_count: totalFailed,
        success_rate: ((totalSent / recipients.length) * 100).toFixed(2) + '%'
    };
}

/**
 * Планирование уведомления
 */
async function scheduleNotification(requestData, supabaseUrl, supabaseKey) {
    const { 
        notification_type,
        recipients,
        title,
        message,
        channels = ['web'],
        data = {},
        scheduled_at,
        repeat_pattern = null
    } = requestData;

    if (!scheduled_at) {
        throw new Error('scheduled_at is required for scheduled notifications');
    }

    const scheduleId = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const schedule = {
        id: scheduleId,
        notification_type: notification_type,
        recipients: recipients,
        title: title,
        message: message,
        channels: channels,
        data: data,
        scheduled_at: scheduled_at,
        repeat_pattern: repeat_pattern,
        status: 'scheduled',
        created_at: new Date().toISOString(),
        executed_count: 0
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/notification_schedules`, {
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

    // Создаем фоновую задачу для выполнения
    await createNotificationTask(createdSchedule, supabaseUrl, supabaseKey);

    return {
        schedule: createdSchedule,
        message: 'Уведомление запланировано',
        scheduled_at: scheduled_at,
        task_created: true
    };
}

/**
 * Настройка webhook
 */
async function setupWebhook(requestData, supabaseUrl, supabaseKey) {
    const { 
        webhook_url,
        events = ['demo.started', 'demo.completed', 'demo.failed'],
        secret,
        active = true,
        description = ''
    } = requestData;

    if (!webhook_url) {
        throw new Error('webhook_url is required');
    }

    const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const webhook = {
        id: webhookId,
        url: webhook_url,
        events: events,
        secret: secret || generateSecret(),
        active: active,
        description: description,
        created_at: new Date().toISOString(),
        last_used: null,
        success_count: 0,
        failure_count: 0
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/webhooks`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(webhook)
    });

    const [createdWebhook] = await response.json();

    // Тестируем webhook
    try {
        await testWebhook(createdWebhook, supabaseUrl, supabaseKey);
    } catch (error) {
        console.warn('Webhook test failed:', error);
    }

    return {
        webhook: createdWebhook,
        message: 'Webhook настроен',
        secret_note: 'Сохраните secret для подписи webhook запросов'
    };
}

/**
 * История уведомлений
 */
async function getNotificationHistory(requestData, supabaseUrl, supabaseKey) {
    const { 
        user_id,
        notification_type,
        date_from,
        date_to,
        status,
        limit = 50,
        offset = 0
    } = requestData;

    let query = `${supabaseUrl}/rest/v1/notifications?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;
    
    if (user_id) {
        query += `&user_id=eq.${user_id}`;
    }
    
    if (notification_type) {
        query += `&type=eq.${notification_type}`;
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

    const response = await fetch(query, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch notification history');
    }

    const notifications = await response.json();

    // Получаем статистику
    const statsResponse = await fetch(`${supabaseUrl}/rest/v1/notifications?select=status&order=created_at.desc&limit=1000`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        }
    });

    let stats = {};
    if (statsResponse.ok) {
        const allNotifications = await statsResponse.json();
        stats = {
            total: allNotifications.length,
            sent: allNotifications.filter(n => n.status === 'sent').length,
            pending: allNotifications.filter(n => n.status === 'pending').length,
            failed: allNotifications.filter(n => n.status === 'failed').length,
            partial: allNotifications.filter(n => n.status === 'partial').length
        };
    }

    return {
        notifications: notifications,
        stats: stats,
        pagination: {
            limit: limit,
            offset: offset,
            has_more: notifications.length === limit
        }
    };
}

/**
 * Управление подписками
 */
async function manageSubscriptions(requestData, supabaseUrl, supabaseKey) {
    const { 
        action, // 'subscribe', 'unsubscribe', 'list'
        user_id,
        event_types = [],
        channels = ['web'],
        notification_preferences = {}
    } = requestData;

    let result = {};

    if (action === 'subscribe') {
        if (!user_id || event_types.length === 0) {
            throw new Error('user_id and event_types are required for subscription');
        }

        // Создаем подписки для каждого типа события
        const subscriptions = [];
        
        for (const eventType of event_types) {
            const subscription = {
                id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                user_id: user_id,
                event_type: eventType,
                channels: channels,
                preferences: notification_preferences,
                active: true,
                created_at: new Date().toISOString()
            };

            await fetch(`${supabaseUrl}/rest/v1/notification_subscriptions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscription)
            });

            subscriptions.push(subscription);
        }

        result = {
            action: 'subscribed',
            user_id: user_id,
            subscriptions: subscriptions,
            message: `Создано ${subscriptions.length} подписок`
        };

    } else if (action === 'unsubscribe') {
        if (!user_id || event_types.length === 0) {
            throw new Error('user_id and event_types are required for unsubscription');
        }

        for (const eventType of event_types) {
            await fetch(`${supabaseUrl}/rest/v1/notification_subscriptions?user_id=eq.${user_id}&event_type=eq.${eventType}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    active: false,
                    unsubscribed_at: new Date().toISOString()
                })
            });
        }

        result = {
            action: 'unsubscribed',
            user_id: user_id,
            event_types: event_types,
            message: `Отписано от ${event_types.length} типов событий`
        };

    } else if (action === 'list') {
        if (!user_id) {
            throw new Error('user_id is required for listing subscriptions');
        }

        const response = await fetch(`${supabaseUrl}/rest/v1/notification_subscriptions?user_id=eq.${user_id}&active=eq.true`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            }
        });

        const subscriptions = response.ok ? await response.json() : [];

        result = {
            action: 'listed',
            user_id: user_id,
            subscriptions: subscriptions,
            count: subscriptions.length
        };
    }

    return result;
}

/**
 * Вспомогательные функции для отправки
 */
async function sendThroughChannel(channel, notification, recipients, supabaseUrl, supabaseKey) {
    switch (channel) {
        case 'web':
            return await sendWebNotification(notification, recipients, supabaseUrl, supabaseKey);
        case 'email':
            return await sendEmailNotification(notification, recipients, supabaseUrl, supabaseKey);
        case 'sms':
            return await sendSMSNotification(notification, recipients, supabaseUrl, supabaseKey);
        case 'push':
            return await sendPushNotification(notification, recipients, supabaseUrl, supabaseKey);
        case 'slack':
            return await sendSlackNotification(notification, recipients, supabaseUrl, supabaseKey);
        case 'discord':
            return await sendDiscordNotification(notification, recipients, supabaseUrl, supabaseKey);
        default:
            throw new Error(`Unsupported channel: ${channel}`);
    }
}

async function sendWebNotification(notification, recipients, supabaseUrl, supabaseKey) {
    // Сохраняем уведомление в таблице web_notifications
    const webNotification = {
        id: `web_${notification.id}`,
        notification_id: notification.id,
        recipients: recipients,
        data: notification.data,
        created_at: new Date().toISOString(),
        read_count: 0
    };

    await fetch(`${supabaseUrl}/rest/v1/web_notifications`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(webNotification)
    });

    return {
        success: true,
        recipients: recipients.length,
        method: 'WebSocket/Real-time'
    };
}

async function sendEmailNotification(notification, recipients, supabaseUrl, supabaseKey) {
    // Для email уведомлений можно использовать внешний сервис
    // Здесь упрощенная реализация
    
    const emailData = {
        to: recipients.map(r => r.email).filter(Boolean),
        subject: notification.title,
        html: `
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            ${notification.data.demo_id ? `<p>Demo ID: ${notification.data.demo_id}</p>` : ''}
        `
    };

    // Сохраняем в таблице email_notifications
    const emailNotification = {
        id: `email_${notification.id}`,
        notification_id: notification.id,
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.html,
        status: 'pending',
        created_at: new Date().toISOString()
    };

    await fetch(`${supabaseUrl}/rest/v1/email_notifications`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailNotification)
    });

    return {
        success: true,
        recipients: emailData.to.length,
        method: 'Email service'
    };
}

async function sendSMSNotification(notification, recipients, supabaseUrl, supabaseKey) {
    const smsRecipients = recipients.filter(r => r.phone).map(r => r.phone);
    
    // Сохраняем в таблице sms_notifications
    const smsNotification = {
        id: `sms_${notification.id}`,
        notification_id: notification.id,
        to: smsRecipients,
        message: `${notification.title}: ${notification.message}`,
        status: 'pending',
        created_at: new Date().toISOString()
    };

    await fetch(`${supabaseUrl}/rest/v1/sms_notifications`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(smsNotification)
    });

    return {
        success: true,
        recipients: smsRecipients.length,
        method: 'SMS service'
    };
}

async function sendPushNotification(notification, recipients, supabaseUrl, supabaseKey) {
    const pushRecipients = recipients.filter(r => r.push_token).map(r => r.push_token);
    
    return {
        success: true,
        recipients: pushRecipients.length,
        method: 'Push notification service'
    };
}

async function sendSlackNotification(notification, recipients, supabaseUrl, supabaseKey) {
    // Сохраняем в таблице slack_notifications
    const slackNotification = {
        id: `slack_${notification.id}`,
        notification_id: notification.id,
        message: `${notification.title}\n${notification.message}`,
        channels: recipients.map(r => r.slack_channel).filter(Boolean),
        status: 'pending',
        created_at: new Date().toISOString()
    };

    await fetch(`${supabaseUrl}/rest/v1/slack_notifications`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(slackNotification)
    });

    return {
        success: true,
        channels: slackNotification.channels.length,
        method: 'Slack webhook'
    };
}

async function sendDiscordNotification(notification, recipients, supabaseUrl, supabaseKey) {
    const discordRecipients = recipients.filter(r => r.discord_webhook).map(r => r.discord_webhook);
    
    return {
        success: true,
        webhooks: discordRecipients.length,
        method: 'Discord webhook'
    };
}

async function broadcastToWebSockets(message, supabaseUrl, supabaseKey) {
    // Используем Supabase Realtime для WebSocket трансляции
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/broadcast_message`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                channel: 'notifications'
            })
        });

        return response.ok;
    } catch (error) {
        console.warn('WebSocket broadcast failed:', error);
        return false;
    }
}

async function createNotificationTask(schedule, supabaseUrl, supabaseKey) {
    const task = {
        id: `task_${schedule.id}`,
        type: 'scheduled_notification',
        schedule_id: schedule.id,
        data: schedule,
        status: 'pending',
        scheduled_at: schedule.scheduled_at,
        created_at: new Date().toISOString()
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

async function testWebhook(webhook, supabaseUrl, supabaseKey) {
    const testPayload = {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        data: {
            webhook_id: webhook.id,
            message: 'Test webhook delivery'
        }
    };

    const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': webhook.secret,
            'User-Agent': 'AI-Assistant-Webhook/1.0'
        },
        body: JSON.stringify(testPayload)
    });

    // Обновляем статистику webhook
    await fetch(`${supabaseUrl}/rest/v1/webhooks?id=eq.${webhook.id}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            last_used: new Date().toISOString(),
            success_count: webhook.success_count + (response.ok ? 1 : 0),
            failure_count: webhook.failure_count + (response.ok ? 0 : 1)
        })
    });

    return response.ok;
}

function generateSecret() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}