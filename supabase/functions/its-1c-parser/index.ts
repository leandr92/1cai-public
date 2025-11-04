// Edge Function для парсинга its.1c.ru с авторизованным доступом
// Парсит документацию, примеры кода и типовые решения

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Получаем параметры запроса
    const requestData = await req.json();
    const { 
      url, 
      category = 'documentation', 
      subcategory = 'general',
      force_refresh = false,
      user_id 
    } = requestData;

    // Валидация входных данных
    if (!url) {
      throw new Error('URL параметр обязателен для парсинга');
    }

    if (!user_id) {
      throw new Error('user_id обязателен для авторизации');
    }

    // Получаем конфигурацию Supabase
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Конфигурация Supabase отсутствует');
    }

    // Проверяем, существует ли уже этот контент в базе
    const contentHash = await generateContentHash(url);
    const existingContent = await checkExistingContent(supabaseUrl, serviceRoleKey, contentHash);

    if (existingContent && !force_refresh) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          message: 'Контент уже существует в базе данных',
          content_id: existingContent.id,
          title: existingContent.title
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Получаем учетные данные для its.1c.ru
    const credentials = await getCredentials(supabaseUrl, serviceRoleKey, user_id, 'its_1c');
    
    if (!credentials) {
      throw new Error('Учетные данные для its.1c.ru не найдены. Добавьте логин и пароль в настройки.');
    }

    // Авторизация на its.1c.ru
    const sessionCookie = await authenticateWithIts1C(credentials);
    
    if (!sessionCookie) {
      throw new Error('Ошибка авторизации на its.1c.ru');
    }

    // Парсим контент
    const parsedContent = await parseIts1CContent(url, sessionCookie, category);

    if (!parsedContent || !parsedContent.title || !parsedContent.content) {
      throw new Error('Не удалось извлечь контент с указанного URL');
    }

    // Сохраняем в базу данных
    const savedContent = await saveToKnowledgeBase(
      supabaseUrl, 
      serviceRoleKey, 
      parsedContent, 
      contentHash, 
      url,
      category,
      subcategory
    );

    return new Response(JSON.stringify({
      success: true,
      data: {
        message: 'Контент успешно спарсен и сохранен',
        content_id: savedContent.id,
        title: parsedContent.title,
        category: parsedContent.category,
        code_examples_count: parsedContent.codeExamples.length,
        content_length: parsedContent.content.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('ITS.1C Parser error:', error);
    
    return new Response(JSON.stringify({
      error: {
        code: 'PARSING_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Получение учетных данных из зашифрованного хранилища
async function getCredentials(supabaseUrl: string, serviceRoleKey: string, userId: string, serviceName: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/encrypted_credentials?user_id=eq.${userId}&service_name=eq.${serviceName}&is_active=eq.true`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Ошибка при получении учетных данных');
  }

  const credentials = await response.json();
  
  if (!credentials || credentials.length === 0) {
    return null;
  }

  // Расшифровка данных (в реальном проекте нужна proper decryption)
  const encryptedData = credentials[0].encrypted_data;
  return {
    username: encryptedData.username,
    password: encryptedData.password
  };
}

// Авторизация на its.1c.ru
async function authenticateWithIts1C(credentials: {username: string, password: string}) {
  try {
    const authResponse = await fetch('https://its.1c.ru/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: new URLSearchParams({
        'login': credentials.username,
        'password': credentials.password
      })
    });

    // Проверяем наличие cookie сессии
    const sessionCookie = authResponse.headers.get('set-cookie');
    
    if (sessionCookie && sessionCookie.includes('session')) {
      // Обновляем время использования учетных данных
      await updateCredentialsUsage(credentials);
      return sessionCookie;
    }

    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Парсинг контента с its.1c.ru
async function parseIts1CContent(url: string, sessionCookie: string, category: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // Извлекаем контент разными способами в зависимости от типа страницы
    let parsedData;
    
    if (url.includes('/api/') || url.includes('/method/')) {
      parsedData = parseAPIDocumentation(html, url);
    } else if (url.includes('/db/') || url.includes('/guide/')) {
      parsedData = parseGuideContent(html, url);
    } else if (url.includes('/code/') || url.includes('/example/')) {
      parsedData = parseCodeExample(html, url);
    } else {
      parsedData = parseGeneralContent(html, url);
    }

    return {
      ...parsedData,
      category: determineCategory(url, category),
      content: cleanHtmlContent(parsedData.content),
      metadata: {
        parsed_at: new Date().toISOString(),
        source_url: url,
        parser_version: '1.0.0'
      }
    };

  } catch (error) {
    console.error('Content parsing error:', error);
    throw new Error(`Ошибка при парсинге контента: ${error.message}`);
  }
}

// Парсинг API документации
function parseAPIDocumentation(html: string, url: string) {
  const title = extractTitle(html);
  const content = extractMainContent(html);
  const codeExamples = extractCodeExamples(html);
  
  return {
    title,
    content,
    codeExamples,
    subcategory: 'api'
  };
}

// Парсинг руководств и гайдов
function parseGuideContent(html: string, url: string) {
  const title = extractTitle(html);
  const content = extractMainContent(html);
  const codeExamples = extractCodeExamples(html);
  
  return {
    title,
    content,
    codeExamples,
    subcategory: 'guide'
  };
}

// Парсинг примеров кода
function parseCodeExample(html: string, url: string) {
  const title = extractTitle(html);
  const content = extractMainContent(html);
  const codeExamples = extractCodeExamples(html);
  
  return {
    title,
    content,
    codeExamples,
    subcategory: 'code'
  };
}

// Парсинг общего контента
function parseGeneralContent(html: string, url: string) {
  const title = extractTitle(html);
  const content = extractMainContent(html);
  const codeExamples = extractCodeExamples(html);
  
  return {
    title,
    content,
    codeExamples,
    subcategory: 'general'
  };
}

// Извлечение заголовка
function extractTitle(html: string): string {
  // Ищем заголовок в различных тегах
  const titlePatterns = [
    /<h1[^>]*>([^<]+)<\/h1>/i,
    /<title>([^<]+)<\/title>/i,
    /<h2[^>]*>([^<]+)<\/h2>/i
  ];

  for (const pattern of titlePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return cleanText(match[1]);
    }
  }

  return 'Без названия';
}

// Извлечение основного контента
function extractMainContent(html: string): string {
  // Удаляем навигацию, меню, рекламу
  let cleanHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Ищем основной контент
  const contentPatterns = [
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*main[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*id="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  ];

  for (const pattern of contentPatterns) {
    const match = cleanHtml.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Если не нашли специальные контейнеры, берем body
  const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1];
  }

  return cleanHtml;
}

// Извлечение примеров кода
function extractCodeExamples(html: string): string[] {
  const codeExamples: string[] = [];
  
  // Ищем блоки кода в различных форматах
  const codePatterns = [
    /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi,
    /<code[^>]*class="[^"]*language-1c[^"]*"[^>]*>([\s\S]*?)<\/code>/gi,
    /<code[^>]*class="[^"]*language-v8[^"]*"[^>]*>([\s\S]*?)<\/code>/gi,
    /<pre[^>]*class="[^"]*code[^"]*"[^>]*>([\s\S]*?)<\/pre>/gi
  ];

  for (const pattern of codePatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const code = cleanText(match[1]);
        if (code.length > 20) { // Фильтруем слишком короткие фрагменты
          codeExamples.push(code);
        }
      }
    }
  }

  return codeExamples;
}

// Очистка HTML разметки
function cleanHtmlContent(html: string): string {
  return html
    // Удаляем все теги
    .replace(/<[^>]*>/g, ' ')
    // Удаляем множественные пробелы
    .replace(/\s+/g, ' ')
    // Удаляем лишние переносы строк
    .replace(/\n\s*\n/g, '\n')
    // Тримминг
    .trim();
}

// Очистка текста от HTML
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Определение категории по URL
function determineCategory(url: string, defaultCategory: string): string {
  if (url.includes('/api/') || url.includes('/method/')) return 'API';
  if (url.includes('/db/') || url.includes('/guide/')) return 'documentation';
  if (url.includes('/code/') || url.includes('/example/')) return 'examples';
  if (url.includes('/solution/') || url.includes('/pattern/')) return 'solutions';
  
  return defaultCategory;
}

// Генерация хеша контента
async function generateContentHash(url: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(url);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Проверка существующего контента
async function checkExistingContent(supabaseUrl: string, serviceRoleKey: string, contentHash: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/its_1c_knowledge_base?content_hash=eq.${contentHash}`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    }
  });

  if (response.ok) {
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
  }

  return null;
}

// Сохранение в базу знаний
async function saveToKnowledgeBase(
  supabaseUrl: string,
  serviceRoleKey: string,
  parsedContent: any,
  contentHash: string,
  sourceUrl: string,
  category: string,
  subcategory: string
) {
  const contentData = {
    content_hash: contentHash,
    category: parsedContent.category || category,
    subcategory: parsedContent.subcategory || subcategory,
    title: parsedContent.title,
    content: parsedContent.content,
    code_examples: parsedContent.codeExamples.join('\n\n---\n\n'),
    metadata: parsedContent.metadata,
    source_url: sourceUrl,
    version: '1.0'
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/its_1c_knowledge_base`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(contentData)
  });

  if (!response.ok) {
    throw new Error(`Ошибка при сохранении в базу данных: ${await response.text()}`);
  }

  const savedData = await response.json();
  return savedData[0];
}

// Обновление времени использования учетных данных
async function updateCredentialsUsage(credentials: any) {
  // В реальном проекте здесь была бы логика обновления encrypted_credentials
  console.log('Credentials usage updated:', new Date().toISOString());
}