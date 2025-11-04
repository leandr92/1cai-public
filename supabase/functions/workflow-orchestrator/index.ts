// Workflow Orchestrator - координатор агентов
// Управляет последовательным выполнением агентов

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { user_task, user_id, demo_type = 'quick', selected_agent } = await req.json();

    if (!user_task || !user_id) {
      throw new Error('user_task and user_id are required');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // Создаем demo запись
    const demo = await createDemo(supabaseUrl, serviceRoleKey, {
      type: demo_type,
      status: 'running',
      progress: 0,
      created_by: user_id,
      results: { user_task, selected_agent: selected_agent || 'all' }
    });

    const demoId = demo.id;

    // Определяем список агентов для выполнения
    let stages = [];
    
    if (selected_agent) {
      // Режим single_agent - выполняем только выбранного агента
      const agentMap: any = {
        'analyze-task': { name: 'Архитектор 1С', order: 1, agent: 'analyze-task' },
        'develop-solution': { name: 'Разработчик', order: 1, agent: 'develop-solution' },
        'provide-consultation': { name: 'Консультант', order: 1, agent: 'provide-consultation' }
      };
      
      if (agentMap[selected_agent]) {
        stages = [agentMap[selected_agent]];
      } else {
        throw new Error(`Invalid agent: ${selected_agent}`);
      }
    } else {
      // Полный workflow - все агенты
      stages = [
        { name: 'Архитектор 1С', order: 1, agent: 'analyze-task' },
        { name: 'Разработчик', order: 2, agent: 'develop-solution' },
        { name: 'Консультант', order: 3, agent: 'provide-consultation' }
      ];
    }

    const createdStages = await createStages(supabaseUrl, serviceRoleKey, demoId, stages);

    // Запускаем асинхронную обработку
    processWorkflow(supabaseUrl, serviceRoleKey, demoId, user_task, createdStages, selected_agent).catch(err => {
      console.error('Workflow processing error:', err);
    });

    // Возвращаем немедленный ответ
    return new Response(JSON.stringify({
      success: true,
      demo_id: demoId,
      message: selected_agent 
        ? `Запущен агент: ${stages[0].name}` 
        : 'Обработка началась, следите за прогрессом на Dashboard'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Orchestrator error:', error);
    return new Response(JSON.stringify({
      error: {
        code: 'ORCHESTRATOR_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processWorkflow(url: string, key: string, demoId: string, userTask: string, stages: any[], selectedAgent?: string) {
  try {
    let analysisResult: any = null;
    let solutionResult: any = null;

    // Если выбран конкретный агент - выполняем только его
    if (selectedAgent === 'analyze-task') {
      const analyzeStage = stages[0];
      await updateStage(url, key, analyzeStage.id, { status: 'processing', progress: 10 });
      await updateDemo(url, key, demoId, { progress: 50 });

      await callAgent(url, 'analyze-task', {
        user_task: userTask,
        demo_id: demoId,
        stage_id: analyzeStage.id
      });

      await updateDemo(url, key, demoId, { 
        status: 'completed',
        progress: 100,
        end_time: new Date().toISOString(),
        results: {
          user_task: userTask,
          summary: 'Анализ задачи завершен',
          selected_agent: 'analyze-task'
        }
      });
      return;
    }

    if (selectedAgent === 'develop-solution') {
      const developStage = stages[0];
      await updateStage(url, key, developStage.id, { status: 'processing', progress: 10 });
      await updateDemo(url, key, demoId, { progress: 50 });

      await callAgent(url, 'develop-solution', {
        user_task: userTask,
        demo_id: demoId,
        stage_id: developStage.id
      });

      await updateDemo(url, key, demoId, { 
        status: 'completed',
        progress: 100,
        end_time: new Date().toISOString(),
        results: {
          user_task: userTask,
          summary: 'Разработка решения завершена',
          selected_agent: 'develop-solution'
        }
      });
      return;
    }

    if (selectedAgent === 'provide-consultation') {
      const consultStage = stages[0];
      await updateStage(url, key, consultStage.id, { status: 'processing', progress: 10 });
      await updateDemo(url, key, demoId, { progress: 50 });

      await callAgent(url, 'provide-consultation', {
        user_task: userTask,
        demo_id: demoId,
        stage_id: consultStage.id
      });

      await updateDemo(url, key, demoId, { 
        status: 'completed',
        progress: 100,
        end_time: new Date().toISOString(),
        results: {
          user_task: userTask,
          summary: 'Консультация завершена',
          selected_agent: 'provide-consultation'
        }
      });
      return;
    }

    // Полный workflow - все агенты последовательно
    // Этап 1: Анализ задачи
    const analyzeStage = stages.find(s => s.stage_name === 'Архитектор 1С');
    if (analyzeStage) {
      await updateStage(url, key, analyzeStage.id, { status: 'processing', progress: 10 });
      await updateDemo(url, key, demoId, { progress: 10 });

      analysisResult = await callAgent(url, 'analyze-task', {
        user_task: userTask,
        demo_id: demoId,
        stage_id: analyzeStage.id
      });

      await updateDemo(url, key, demoId, { progress: 33 });
    }

    // Этап 2: Разработка решения
    const developStage = stages.find(s => s.stage_name === 'Разработчик');
    if (developStage) {
      await updateStage(url, key, developStage.id, { status: 'processing', progress: 10 });
      await updateDemo(url, key, demoId, { progress: 40 });

      solutionResult = await callAgent(url, 'develop-solution', {
        user_task: userTask,
        analysis: analysisResult?.data?.analysis,
        demo_id: demoId,
        stage_id: developStage.id
      });

      await updateDemo(url, key, demoId, { progress: 66 });
    }

    // Этап 3: Консультация
    const consultStage = stages.find(s => s.stage_name === 'Консультант');
    if (consultStage) {
      await updateStage(url, key, consultStage.id, { status: 'processing', progress: 10 });
      await updateDemo(url, key, demoId, { progress: 70 });

      await callAgent(url, 'provide-consultation', {
        user_task: userTask,
        analysis: analysisResult?.data?.analysis,
        solution: solutionResult?.data?.solution,
        demo_id: demoId,
        stage_id: consultStage.id
      });

      await updateDemo(url, key, demoId, { progress: 100 });
    }

    // Завершаем demo
    await updateDemo(url, key, demoId, {
      status: 'completed',
      progress: 100,
      end_time: new Date().toISOString(),
      results: {
        user_task: userTask,
        summary: 'Задача успешно выполнена всеми агентами',
        completed_stages: stages.length
      }
    });

  } catch (error: any) {
    console.error('Workflow processing error:', error);
    
    // Обновляем demo с ошибкой
    await updateDemo(url, key, demoId, {
      status: 'failed',
      end_time: new Date().toISOString(),
      results: {
        user_task: userTask,
        error: error.message
      }
    });
  }
}

async function createDemo(url: string, key: string, demoData: any) {
  // Generate unique demo ID
  const demoId = `demo_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  
  const response = await fetch(`${url}/rest/v1/demos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'apikey': key,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      id: demoId,
      ...demoData,
      roles: ['architect', 'developer', 'consultant'],
      complexity: 'medium',
      created_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create demo: ${error}`);
  }

  const data = await response.json();
  return data[0];
}

async function createStages(url: string, key: string, demoId: string, stages: any[]) {
  const stageRecords = stages.map(stage => ({
    demo_id: demoId,
    stage_name: stage.name,
    stage_order: stage.order,
    status: 'pending',
    progress: 0,
    started_at: null,
    completed_at: null,
    output: null
  }));

  const response = await fetch(`${url}/rest/v1/demo_stages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'apikey': key,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(stageRecords)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create stages: ${error}`);
  }

  return await response.json();
}

async function updateDemo(url: string, key: string, demoId: string, updates: any) {
  const response = await fetch(`${url}/rest/v1/demos?id=eq.${demoId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${key}`,
      'apikey': key,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to update demo: ${error}`);
  }
}

async function updateStage(url: string, key: string, stageId: string, updates: any) {
  const response = await fetch(`${url}/rest/v1/demo_stages?id=eq.${stageId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${key}`,
      'apikey': key,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      ...updates,
      started_at: updates.status === 'processing' ? new Date().toISOString() : undefined
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to update stage: ${error}`);
  }
}

async function callAgent(url: string, agentName: string, data: any) {
  const response = await fetch(`${url}/functions/v1/${agentName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Agent ${agentName} failed: ${error}`);
  }

  return await response.json();
}
