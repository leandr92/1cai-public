/**
 * Edge Function: demo-developer
 * Роль: 1С Разработчик - генерация кода и реализация решения
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

        const { demo_id, user_task, architecture_output } = await req.json();

        if (!demo_id || !user_task) {
            throw new Error('demo_id и user_task обязательны');
        }

        // Обновляем стадию на "processing"
        await fetch(`${supabaseUrl}/rest/v1/demo_stages?demo_id=eq.${demo_id}&stage_name=eq.Разработчик`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'processing',
                progress: 40,
                started_at: new Date().toISOString(),
                output: { message: 'Генерируем код на основе архитектурного решения...', task: user_task }
            })
        });

        // Симуляция разработки (2.5 секунды)
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Генерация кода на основе задачи
        const taskLower = user_task.toLowerCase();
        let generatedCode = [];
        let codeExamples = [];
        let testCases = [];

        if (taskLower.includes('отчет') || taskLower.includes('report')) {
            generatedCode.push({
                file: 'Отчет_ПоПродажам.xml',
                type: 'Report',
                code: `// Запрос для отчета по продажам
ВЫБРАТЬ
    Продажи.Период КАК Период,
    Продажи.Номенклатура КАК Номенклатура,
    СУММА(Продажи.Количество) КАК Количество,
    СУММА(Продажи.Сумма) КАК Сумма
ИЗ
    РегистрНакопления.Продажи КАК Продажи
СГРУППИРОВАТЬ ПО
    Продажи.Период,
    Продажи.Номенклатура`
            });
            testCases.push('Проверка выборки данных за период');
            testCases.push('Проверка группировки по номенклатуре');
        }

        if (taskLower.includes('документ') || taskLower.includes('накладн')) {
            generatedCode.push({
                file: 'Документ_РасходнаяНакладная.xml',
                type: 'Document',
                code: `// Обработчик проведения документа
Процедура ОбработкаПроведения(Отказ, РежимПроведения)
    
    // Движения по регистру остатков
    Движения.ОстаткиТоваров.Записывать = Истина;
    
    Для Каждого СтрокаТабличнойЧасти Из ТабличнаяЧасть Цикл
        Движение = Движения.ОстаткиТоваров.Добавить();
        Движение.ВидДвижения = ВидДвиженияНакопления.Расход;
        Движение.Период = Дата;
        Движение.Номенклатура = СтрокаТабличнойЧасти.Номенклатура;
        Движение.Количество = СтрокаТабличнойЧасти.Количество;
        Движение.Склад = Склад;
    КонецЦикла;
    
КонецПроцедуры`
            });
            testCases.push('Проверка движений по регистрам');
            testCases.push('Проверка контроля остатков');
        }

        if (taskLower.includes('права') || taskLower.includes('доступ')) {
            generatedCode.push({
                file: 'ОбщийМодуль_УправлениеДоступом.xml',
                type: 'CommonModule',
                code: `// Функция проверки прав доступа
Функция ПроверитьПраваДоступа(Пользователь, Действие, Объект) Экспорт
    
    // Получаем роли пользователя
    Роли = ПолучитьРолиПользователя(Пользователь);
    
    // Проверяем права для каждой роли
    Для Каждого Роль Из Роли Цикл
        Если РольИмеетПраво(Роль, Действие, Объект) Тогда
            Возврат Истина;
        КонецЕсли;
    КонецЦикла;
    
    Возврат Ложь;
    
КонецФункции`
            });
            testCases.push('Тестирование прав администратора');
            testCases.push('Тестирование прав обычного пользователя');
        }

        // Если не определили специфику - общий код
        if (generatedCode.length === 0) {
            generatedCode.push({
                file: 'ОбщийМодуль_РаботаСЗадачей.xml',
                type: 'CommonModule',
                code: `// Функция обработки задачи: ${user_task}
Функция ОбработатьЗадачу(ПараметрыЗадачи) Экспорт
    
    Результат = Новый Структура;
    Результат.Вставить("Успешно", Истина);
    Результат.Вставить("Сообщение", "Задача обработана");
    
    // Логика обработки задачи
    // ...
    
    Возврат Результат;
    
КонецФункции`
            });
            testCases.push('Базовое тестирование функции');
        }

        const result = {
            status: 'completed',
            development: {
                task: user_task,
                generated_files: generatedCode.length,
                code_examples: generatedCode,
                test_cases: testCases,
                implementation_notes: `Код сгенерирован для задачи: "${user_task}". Реализация включает ${generatedCode.length} файл(ов) и ${testCases.length} тест-кейс(ов).`,
                next_steps: [
                    'Провести code review',
                    'Запустить unit-тесты',
                    'Интегрировать в конфигурацию',
                    'Провести приемочное тестирование'
                ]
            },
            timestamp: new Date().toISOString()
        };

        // Обновляем стадию на "completed"
        await fetch(`${supabaseUrl}/rest/v1/demo_stages?demo_id=eq.${demo_id}&stage_name=eq.Разработчик`, {
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
            role: 'developer',
            demo_id: demo_id,
            result: result
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Developer function error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: {
                code: 'DEVELOPER_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
