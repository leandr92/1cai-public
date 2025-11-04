import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { Demo } from '../../lib/supabase';

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

export default function RecentTasks() {
  const { user } = useAuth();
  const [demos, setDemos] = useState<Demo[]>([]);
  const [demoStages, setDemoStages] = useState<Record<string, DetailedStage[]>>({});
  const [expandedDemo, setExpandedDemo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDemos();
    
    // Subscribe to real-time updates
    const demosChannel = supabase
      .channel('recent-demos-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'demos', filter: `created_by=eq.${user?.id}` },
        (payload) => {
          console.log('Demo change:', payload);
          loadDemos();
        }
      )
      .subscribe();

    const stagesChannel = supabase
      .channel('recent-demo-stages-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'demo_stages' },
        (payload) => {
          console.log('Demo stage change:', payload);
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
  }, [user?.id]);

  async function loadDemos() {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('demos')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      const demosData = data || [];
      setDemos(demosData);
      
      // Load stages for each demo
      for (const demo of demosData) {
        await loadDemoStages(demo.id);
      }
    } catch (error: any) {
      console.error('Error loading demos:', error);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'running':
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      running: 'bg-blue-100 text-blue-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      completed: 'Завершено',
      running: 'Выполняется',
      processing: 'Обработка',
      failed: 'Ошибка',
      pending: 'Ожидание'
    };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ч назад`;
    return date.toLocaleDateString('ru-RU');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (demos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Последние задачи</h2>
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Нет задач. Создайте первую задачу выше.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Последние задачи</h2>
        <button
          onClick={loadDemos}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Обновить"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="space-y-3">
        {demos.map((demo) => (
          <div
            key={demo.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:border-indigo-300 transition-all"
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(demo.status)}
                    <div className="flex-1">
                      {demo.results?.user_task && (
                        <h3 className="font-medium text-gray-900 line-clamp-1">
                          {demo.results.user_task}
                        </h3>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(demo.status)}
                        <span className="text-xs text-gray-500">
                          {formatTime(demo.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          demo.status === 'completed' ? 'bg-green-500' :
                          demo.status === 'failed' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${demo.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 font-medium min-w-[3rem] text-right">
                      {demo.progress}%
                    </span>
                  </div>
                </div>

                {/* Expand Button */}
                {demoStages[demo.id] && demoStages[demo.id].length > 0 && (
                  <button
                    onClick={() => setExpandedDemo(expandedDemo === demo.id ? null : demo.id)}
                    className="ml-3 p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    {expandedDemo === demo.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                )}
              </div>

              {/* Expanded Stages */}
              {expandedDemo === demo.id && demoStages[demo.id] && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                  {demoStages[demo.id].map((stage: DetailedStage) => (
                    <div key={stage.id} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        stage.status === 'completed' ? 'bg-green-500' :
                        stage.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                        stage.status === 'failed' ? 'bg-red-500' :
                        'bg-gray-300'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{stage.stage_name}</span>
                          <span className="text-xs text-gray-500">{stage.progress}%</span>
                        </div>
                        {stage.output?.message && (
                          <p className="text-xs text-gray-600 mt-1">{stage.output.message}</p>
                        )}
                        {stage.completed_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(stage.completed_at).toLocaleTimeString('ru-RU')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
