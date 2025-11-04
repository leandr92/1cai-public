import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Demo, DemoStage } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

interface DetailedStage {
  id: string;
  demo_id: string;
  stage_name: string;
  stage_order: number;
  status: string;
  progress: number;
  started_at: string | null;
  completed_at: string | null;
  output: any;
  error_message: string | null;
}

export default function DashboardPage() {
  const { user, profile, signOut } = useAuth();
  const { sendNotification } = useNotifications();
  const [demos, setDemos] = useState<Demo[]>([]);
  const [demoStages, setDemoStages] = useState<Record<string, DetailedStage[]>>({});
  const [loading, setLoading] = useState(true);
  const [startingDemo, setStartingDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadDemos();
    
    // Subscribe to real-time updates for demos
    const demosChannel = supabase
      .channel('demos-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'demos' },
        (payload) => {
          console.log('Demo change:', payload);
          loadDemos();
        }
      )
      .subscribe();

    // Subscribe to real-time updates for demo_stages
    const stagesChannel = supabase
      .channel('demo-stages-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'demo_stages' },
        (payload) => {
          console.log('Demo stage change:', payload);
          // Reload stages for affected demo
          if (payload.new && 'demo_id' in payload.new) {
            loadDemoStages(payload.new.demo_id as string);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(demosChannel);
      supabase.removeChannel(stagesChannel);
    };
  }, []);

  async function loadDemos() {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('demos')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      const demosData = data || [];
      setDemos(demosData);
      
      // Load stages for each demo
      for (const demo of demosData) {
        await loadDemoStages(demo.id);
      }
    } catch (error: any) {
      console.error('Error loading demos:', error);
      setError('Не удалось загрузить демонстрации: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  }

  async function loadDemoStages(demoId: string) {
    try {
      const { data, error } = await supabase
        .from('demo_stages')
        .select('*')
        .eq('demo_id', demoId)
        .order('stage_order', { ascending: true });

      if (error) throw error;
      
      if (data) {
        setDemoStages(prev => ({
          ...prev,
          [demoId]: data as DetailedStage[]
        }));
      }
    } catch (error: any) {
      console.error('Error loading demo stages:', error);
    }
  }

  async function startNewDemo() {
    if (!user) {
      setError('Необходимо войти в систему для запуска демонстрации');
      return;
    }
    
    setStartingDemo(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('start-demo', {
        body: {
          demo_type: 'full',
          user_task: 'Полная демонстрация всех возможностей системы',
          user_id: user.id,
          roles: ['architect', 'developer', 'pm', 'ba'],
          complexity: 'medium',
          include_ml: true,
          custom_scenarios: [],
        },
      });

      if (error) throw error;
      
      if (!data || !data.success) {
        throw new Error(data?.error?.message || 'Неожиданный ответ от сервера');
      }
      
      console.log('Demo started:', data);
      
      setSuccess('Демонстрация успешно запущена!');
      
      // Send notification
      await sendNotification({
        title: 'Демонстрация запущена',
        message: `Запущена новая демонстрация ${data.demo_id || 'unknown'}`,
        type: 'demo.started',
        priority: 'normal',
      });
      
      // Reload demos after short delay
      setTimeout(() => {
        loadDemos();
        setSuccess(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error starting demo:', error);
      
      let errorMessage = 'Не удалось запустить демонстрацию';
      if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      // Send error notification
      await sendNotification({
        title: 'Ошибка демонстрации',
        message: errorMessage,
        type: 'demo.failed',
        priority: 'high',
      });
    } finally {
      setStartingDemo(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getRoleBadgeColor(role: string) {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      user: 'bg-blue-100 text-blue-800',
      guest: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Управление демонстрациями AI ассистентов
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name || user?.email}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(profile?.role || 'guest')}`}>
                  {profile?.role || 'guest'}
                </span>
              </div>
              <button
                onClick={signOut}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Start Demo Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Запустить новую демонстрацию</h2>
          <button
            onClick={startNewDemo}
            disabled={startingDemo}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {startingDemo ? 'Запуск...' : 'Запустить полную демонстрацию'}
          </button>
          
          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          
          {/* Success message */}
          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
              {success}
            </div>
          )}
        </div>

        {/* Demos List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">История демонстраций</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {demos.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                Нет демонстраций. Запустите новую демонстрацию.
              </div>
            ) : (
              demos.map((demo) => (
                <div key={demo.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {demo.id}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(demo.status)}`}>
                          {demo.status}
                        </span>
                      </div>
                      
                      {/* Display user task if available */}
                      {demo.results?.user_task && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800">
                          <strong>Задача:</strong> {demo.results.user_task}
                        </div>
                      )}
                      
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>Тип: {demo.type}</span>
                        <span>Сложность: {demo.complexity}</span>
                        <span>Роли: {demo.roles.join(', ')}</span>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">Прогресс:</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${demo.progress}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm text-gray-500">{demo.progress}%</span>
                        </div>
                      </div>
                      
                      {/* Display results summary if completed */}
                      {demo.status === 'completed' && demo.results?.summary && (
                        <div className="mt-3 p-2 bg-green-50 border border-green-100 rounded text-sm text-green-800">
                          <strong>Результат:</strong> {demo.results.summary}
                        </div>
                      )}
                      
                      {/* Display detailed stages from demo_stages table */}
                      {demoStages[demo.id] && demoStages[demo.id].length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-500 mb-2">Детальные этапы (Real-time):</p>
                          <div className="space-y-2">
                            {demoStages[demo.id].map((stage: DetailedStage) => (
                              <div key={stage.id} className="border-l-4 pl-3 py-1" style={{
                                borderColor: stage.status === 'completed' ? '#10b981' :
                                            stage.status === 'processing' ? '#3b82f6' :
                                            stage.status === 'failed' ? '#ef4444' :
                                            '#d1d5db'
                              }}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${
                                      stage.status === 'completed' ? 'bg-green-500' :
                                      stage.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                                      stage.status === 'failed' ? 'bg-red-500' :
                                      'bg-gray-300'
                                    }`}></span>
                                    <span className="text-sm font-medium text-gray-700">{stage.stage_name}</span>
                                  </div>
                                  <span className="text-xs text-gray-500">{stage.progress}%</span>
                                </div>
                                
                                {/* Progress bar for stage */}
                                {stage.status === 'processing' && (
                                  <div className="mt-1 bg-gray-200 rounded-full h-1">
                                    <div 
                                      className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                      style={{ width: `${stage.progress}%` }}
                                    ></div>
                                  </div>
                                )}
                                
                                {/* Display output message if available */}
                                {stage.output?.message && (
                                  <p className="mt-1 text-xs text-gray-600 italic">{stage.output.message}</p>
                                )}
                                
                                {/* Display architect recommendations */}
                                {stage.stage_name === 'Архитектор 1С' && stage.output?.analysis?.recommendations && stage.status === 'completed' && (
                                  <div className="mt-2 text-xs">
                                    <p className="font-medium text-gray-700">Рекомендации:</p>
                                    <ul className="list-disc list-inside text-gray-600 pl-2">
                                      {stage.output.analysis.recommendations.slice(0, 2).map((rec: string, idx: number) => (
                                        <li key={idx}>{rec}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {/* Display developer code info */}
                                {stage.stage_name === 'Разработчик' && stage.output?.development?.generated_files && stage.status === 'completed' && (
                                  <div className="mt-2 text-xs">
                                    <p className="text-gray-600">
                                      Сгенерировано файлов: <strong>{stage.output.development.generated_files}</strong>
                                    </p>
                                  </div>
                                )}
                                
                                {/* Show timestamps */}
                                {stage.completed_at && (
                                  <p className="mt-1 text-xs text-gray-400">
                                    Завершено: {new Date(stage.completed_at).toLocaleTimeString('ru-RU')}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>{new Date(demo.created_at).toLocaleString('ru-RU')}</p>
                      {demo.end_time && (
                        <p className="mt-1">
                          Завершено: {new Date(demo.end_time).toLocaleString('ru-RU')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
