// Edge Function для векторизации контента через OpenAI
// Разбивает контент на чанки, генерирует embeddings и обновляет базу данных

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Получаем параметры из запроса
    const { 
      content_ids, 
      content_text, 
      chunk_size = 1000, 
      batch_size = 10,
      model = 'text-embedding-3-small' 
    } = await req.json();

    // Валидация входных данных
    if (!content_ids && !content_text) {
      throw new Error('Необходимо указать content_ids или content_text');
    }

    if (chunk_size < 100 || chunk_size > 4000) {
      throw new Error('Размер чанка должен быть от 100 до 4000 токенов');
    }

    if (batch_size < 1 || batch_size > 50) {
      throw new Error('Размер батча должен быть от 1 до 50');
    }

    // Получаем переменные окружения
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openaiApiKey) {
      throw new Error('OpenAI API ключ не настроен');
    }

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Конфигурация Supabase отсутствует');
    }

    let itemsToProcess = [];
    let totalProcessed = 0;
    let totalErrors = 0;
    const errors = [];

    // Если указаны ID записей - получаем их из базы данных
    if (content_ids && content_ids.length > 0) {
      itemsToProcess = await getContentFromDatabase(supabaseUrl, serviceRoleKey, content_ids);
    } else if (content_text) {
      // Если указан текст напрямую
      itemsToProcess = [{
        id: `direct_${Date.now()}`,
        content: content_text,
        title: 'Прямой ввод контента'
      }];
    }

    if (itemsToProcess.length === 0) {
      throw new Error('Контент для обработки не найден');
    }

    // Обрабатываем записи батчами
    for (let i = 0; i < itemsToProcess.length; i += batch_size) {
      const batch = itemsToProcess.slice(i, i + batch_size);
      
      try {
        console.log(`Обрабатываем батч ${Math.floor(i/batch_size) + 1} (${batch.length} записей)`);
        
        const batchResults = await processBatch(batch, openaiApiKey, chunk_size, model);
        
        // Обновляем записи в базе данных
        if (batchResults.length > 0) {
          await updateDatabaseWithVectors(supabaseUrl, serviceRoleKey, batchResults);
        }
        
        totalProcessed += batchResults.length;
        
        // Небольшая задержка между батчами для избежания rate limiting
        if (i + batch_size < itemsToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`Ошибка обработки батча ${Math.floor(i/batch_size) + 1}:`, error);
        totalErrors++;
        errors.push(`Батч ${Math.floor(i/batch_size) + 1}: ${error.message}`);
      }
    }

    // Возвращаем результат
    return new Response(JSON.stringify({
      success: true,
      data: {
        total_items: itemsToProcess.length,
        processed: totalProcessed,
        errors: totalErrors,
        error_details: errors,
        chunk_size,
        batch_size,
        model
      },
      message: `Векторизация завершена. Обработано: ${totalProcessed}, Ошибок: ${totalErrors}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Ошибка векторизации:', error);
    return new Response(JSON.stringify({
      error: {
        code: 'VECTORIZATION_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Функция для получения контента из базы данных
async function getContentFromDatabase(url: string, key: string, contentIds: string[]) {
  const response = await fetch(`${url}/rest/v1/its_1c_knowledge_base?id=in.(${contentIds.join(',')})&select=id,content,title`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${key}`,
      'apikey': key,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ошибка получения данных из БД: ${error}`);
  }

  const data = await response.json();
  return data.map((item: any) => ({
    id: item.id,
    content: item.content,
    title: item.title || `Запись ${item.id}`
  }));
}

// Функция для обработки батча записей
async function processBatch(batch: any[], openaiApiKey: string, chunkSize: number, model: string) {
  const results = [];

  for (const item of batch) {
    try {
      // Разбиваем контент на чанки
      const chunks = splitTextIntoChunks(item.content, chunkSize);
      
      const itemVectors = [];
      
      // Генерируем embeddings для каждого чанка
      for (const [index, chunk] of chunks.entries()) {
        try {
          const embedding = await generateEmbedding(chunk, openaiApiKey, model);
          
          itemVectors.push({
            chunk_index: index,
            content: chunk,
            vector: embedding,
            chunk_size: chunk.length
          });
          
        } catch (error) {
          console.error(`Ошибка генерации embedding для чанка ${index} записи ${item.id}:`, error);
          // Продолжаем с остальными чанками
        }
      }
      
      if (itemVectors.length > 0) {
        results.push({
          id: item.id,
          title: item.title,
          total_chunks: chunks.length,
          vectors: itemVectors
        });
      }
      
    } catch (error) {
      console.error(`Ошибка обработки записи ${item.id}:`, error);
      throw error;
    }
  }

  return results;
}

// Функция для разбиения текста на чанки
function splitTextIntoChunks(text: string, maxTokens: number): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Простая эвристика: ~4 символа на токен для русского текста
  const maxChars = maxTokens * 4;
  const chunks = [];
  
  if (text.length <= maxChars) {
    return [text.trim()];
  }
  
  // Разбиваем по предложениям и абзацам
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    
    if (currentChunk.length + trimmedSentence.length <= maxChars) {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      
      // Если предложение слишком длинное, разбиваем его по словам
      if (trimmedSentence.length > maxChars) {
        const words = trimmedSentence.split(' ');
        let wordChunk = '';
        
        for (const word of words) {
          if (wordChunk.length + word.length <= maxChars) {
            wordChunk += (wordChunk ? ' ' : '') + word;
          } else {
            if (wordChunk) {
              chunks.push(wordChunk.trim());
            }
            wordChunk = word;
          }
        }
        
        if (wordChunk) {
          currentChunk = wordChunk;
        } else {
          currentChunk = '';
        }
      } else {
        currentChunk = trimmedSentence;
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Функция для генерации embedding через OpenAI API
async function generateEmbedding(text: string, openaiApiKey: string, model: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: text,
      model: model
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenAI API ошибка (${response.status}): ${errorData}`);
  }

  const data = await response.json();
  
  if (!data.data || !data.data[0] || !data.data[0].embedding) {
    throw new Error('Неверный ответ от OpenAI API');
  }

  return data.data[0].embedding;
}

// Функция для обновления базы данных с векторами
async function updateDatabaseWithVectors(url: string, key: string, vectorData: any[]) {
  // Подготавливаем обновления для каждой записи
  for (const item of vectorData) {
    try {
      // Создаем JSON с векторами для сохранения в поле vectors
      const vectorsJson = {
        total_chunks: item.total_chunks,
        model: 'text-embedding-3-small',
        updated_at: new Date().toISOString(),
        chunks: item.vectors.map((vector: any) => ({
          index: vector.chunk_index,
          content: vector.content,
          vector: vector.vector,
          size: vector.chunk_size
        }))
      };

      // Обновляем запись в базе данных
      const response = await fetch(`${url}/rest/v1/its_1c_knowledge_base?id=eq.${item.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${key}`,
          'apikey': key,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          vectors: vectorsJson,
          vectorization_status: 'completed',
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`Ошибка обновления записи ${item.id}:`, error);
      }

    } catch (error) {
      console.error(`Ошибка обновления записи ${item.id}:`, error);
    }
  }
}