// RAG Retriever Edge Function для семантического поиска в базе знаний its.1c.ru

interface SearchRequest {
  query: string;
  limit?: number;
  categories?: string[];
  useHybridSearch?: boolean;
  useSemanticOnly?: boolean;
  minRelevanceScore?: number;
  includeContent?: boolean;
  language?: string;
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  url: string;
  relevanceScore: number;
  searchType: 'semantic' | 'fulltext' | 'hybrid';
  metadata?: {
    author?: string;
    publishDate?: string;
    tags?: string[];
    language?: string;
  };
}

interface ContextChunk {
  content: string;
  score: number;
  source: string;
  metadata?: Record<string, any>;
}

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
    // Получение переменных окружения
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Извлечение параметров запроса
    const requestData: SearchRequest = await req.json();
    const { 
      query, 
      limit = 10, 
      categories = [], 
      useHybridSearch = true,
      useSemanticOnly = false,
      minRelevanceScore = 0.7,
      includeContent = true,
      language = 'ru'
    } = requestData;

    // Валидация входных данных
    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: SearchResult[] = [];

    // Семантический поиск через векторные эмбеддинги
    if (!useSemanticOnly) {
      try {
        const semanticResults = await performSemanticSearch(supabaseUrl, supabaseKey, query, limit, categories, language);
        results.push(...semanticResults);
      } catch (error) {
        console.error('Semantic search error:', error);
      }
    }

    // Полнотекстовый поиск
    if (useHybridSearch) {
      try {
        const fulltextResults = await performFulltextSearch(supabaseUrl, supabaseKey, query, limit, categories, language);
        results.push(...fulltextResults);
      } catch (error) {
        console.error('Fulltext search error:', error);
      }
    }

    // Гибридное ранжирование результатов
    const rankedResults = await rankResults(results, useHybridSearch, minRelevanceScore);

    // Формирование контекста для AI
    const context = await generateContext(rankedResults.slice(0, 5), includeContent);

    // Формирование ответа
    const response = {
      success: true,
      query,
      totalResults: rankedResults.length,
      results: rankedResults.slice(0, limit),
      context,
      searchParams: {
        useHybridSearch,
        useSemanticOnly,
        minRelevanceScore,
        categories,
        limit,
        language
      },
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('RAG Retriever Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Функция семантического поиска через векторные эмбеддинги
async function performSemanticSearch(
  supabaseUrl: string, 
  supabaseKey: string, 
  query: string, 
  limit: number, 
  categories: string[], 
  language: string
): Promise<SearchResult[]> {
  
  try {
    // Создание эмбеддинга запроса
    const embedding = await createEmbedding(query);
    
    // Формирование SQL запроса для векторного поиска с RPC функцией
    let rpcParams = {
      query_embedding: embedding,
      similarity_threshold: 0.7,
      match_count: limit
    };
    
    // Добавляем фильтры если есть
    if (categories.length > 0) {
      rpcParams.category_filter = categories;
    }
    
    // Выполнение RPC запроса
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/match_documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(rpcParams)
    });

    if (!response.ok) {
      throw new Error(`RPC request failed: ${response.status}`);
    }

    const data = await response.json();
    
    return data?.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      url: row.url,
      relevanceScore: row.similarity || row.score || 0,
      searchType: 'semantic' as const,
      metadata: row.metadata || {},
      language: row.language || language
    })) || [];
    
  } catch (error) {
    console.error('Semantic search failed:', error);
    return [];
  }
}

// Функция полнотекстового поиска
async function performFulltextSearch(
  supabaseUrl: string, 
  supabaseKey: string, 
  query: string, 
  limit: number, 
  categories: string[], 
  language: string
): Promise<SearchResult[]> {
  
  try {
    // Формирование параметров для поиска
    const searchParams = new URLSearchParams({
      select: 'id,title,content,category,url,metadata,language',
      limit: limit.toString(),
      language: `eq.${language}`,
      content: `ilike.*${query}*`
    });

    // Добавляем фильтр по категориям
    if (categories.length > 0) {
      searchParams.append('category', `in.(${categories.join(',')})`);
    }

    // Выполнение запроса к таблице напрямую
    const response = await fetch(`${supabaseUrl}/rest/v1/its_1c_knowledge_base?${searchParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Search request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Вычисляем простой релевантный скор на основе частотности слов
    const scoredData = data.map((row: any) => {
      const text = (row.title + ' ' + row.content).toLowerCase();
      const words = query.toLowerCase().split(' ');
      let score = 0;
      
      words.forEach(word => {
        const matches = (text.match(new RegExp(word, 'g')) || []).length;
        score += matches * 0.1; // Простой расчет релевантности
      });
      
      return {
        ...row,
        relevanceScore: Math.min(score, 1) // Ограничиваем до 1
      };
    });

    // Сортируем по релевантности
    scoredData.sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);
    
    return scoredData.slice(0, limit).map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      url: row.url,
      relevanceScore: row.relevanceScore || 0.1,
      searchType: 'fulltext' as const,
      metadata: row.metadata || {},
      language: row.language || language
    }));
    
  } catch (error) {
    console.error('Fulltext search failed:', error);
    return [];
  }
}

// Функция гибридного ранжирования результатов
async function rankResults(
  results: SearchResult[], 
  useHybridSearch: boolean, 
  minRelevanceScore: number
): Promise<SearchResult[]> {
  
  const filtered = results.filter(result => result.relevanceScore >= minRelevanceScore);
  
  // Комбинирование и переранжирование результатов
  const seen = new Set();
  const uniqueResults = filtered.filter(result => {
    const key = result.id;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
  
  // Бонус за гибридный поиск
  return uniqueResults.sort((a, b) => {
    let scoreA = a.relevanceScore;
    let scoreB = b.relevanceScore;
    
    if (useHybridSearch && a.searchType === 'hybrid') scoreA += 0.1;
    if (useHybridSearch && b.searchType === 'hybrid') scoreB += 0.1;
    
    // Бонус за более высокий рейтинг источника
    if (a.category === 'официальная_документация') scoreA += 0.05;
    if (b.category === 'официальная_документация') scoreB += 0.05;
    
    return scoreB - scoreA;
  });
}

// Функция генерации контекста для AI
async function generateContext(results: SearchResult[], includeContent: boolean): Promise<string[]> {
  
  const contextChunks: string[] = [];
  
  for (const result of results) {
    let chunk = `Источник: ${result.title} (${result.category})\n`;
    
    if (includeContent && result.content) {
      // Ограничиваем контент для лучшего контекста
      const maxLength = 2000;
      const content = result.content.length > maxLength 
        ? result.content.substring(0, maxLength) + '...'
        : result.content;
      
      chunk += `Контент: ${content}\n`;
    }
    
    chunk += `URL: ${result.url}\n`;
    chunk += `Релевантность: ${(result.relevanceScore * 100).toFixed(1)}%\n`;
    
    contextChunks.push(chunk);
  }
  
  return contextChunks;
}

// Функция создания эмбеддинга с использованием OpenAI API
async function createEmbedding(text: string): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    console.warn('OpenAI API key not found, using simple embedding');
    return createSimpleEmbedding(text);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small' // Используем компактную модель для скорости
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;
    
    // Преобразуем в формат PostgreSQL vector
    return `[${embedding.join(',')}]`;
    
  } catch (error) {
    console.error('OpenAI embedding failed:', error);
    return createSimpleEmbedding(text);
  }
}

// Простая функция создания эмбеддинга для случая отсутствия OpenAI ключа
function createSimpleEmbedding(text: string): string {
  const dimensions = 1536;
  const words = text.toLowerCase().split(/\s+/);
  const vector = Array(dimensions).fill(0);
  
  // Простая хеширующая функция для слов
  words.forEach(word => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      const char = word.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Распределяем значение слова по вектору
    const index = Math.abs(hash) % dimensions;
    vector[index] += 1;
  });
  
  // Нормализуем вектор
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  const normalized = magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  
  return `[${normalized.join(',')}]`;
}