import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  Plus, 
  FileText, 
  BarChart, 
  Settings as SettingsIcon,
  Zap 
} from 'lucide-react';

export default function QuickActions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [taskInput, setTaskInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const templates = [
    {
      id: 'report',
      title: 'Создать отчет',
      description: 'Автоматическая генерация отчета',
      icon: BarChart,
      color: 'from-blue-500 to-blue-600',
      task: 'Создать отчет по продажам за последний месяц'
    },
    {
      id: 'document',
      title: 'Создать документ',
      description: 'Новый документ 1С',
      icon: FileText,
      color: 'from-green-500 to-green-600',
      task: 'Создать документ поступления товаров'
    },
    {
      id: 'processing',
      title: 'Обработка данных',
      description: 'Автоматическая обработка',
      icon: SettingsIcon,
      color: 'from-purple-500 to-purple-600',
      task: 'Создать обработку для импорта данных из Excel'
    }
  ];

  const handleQuickStart = async (task: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('workflow-orchestrator', {
        body: {
          user_task: task,
          user_id: user.id,
          demo_type: 'quick'
        },
      });

      if (functionError) {
        throw new Error(functionError.message || 'Не удалось запустить задачу');
      }

      if (!data || !data.success) {
        throw new Error(data?.error?.message || 'Неожиданный ответ от сервера');
      }

      setTaskInput('');
      // Task started successfully, it will appear in RecentTasks via real-time
    } catch (err: any) {
      console.error('Error starting task:', err);
      setError(err.message || 'Произошла ошибка при запуске задачи');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomTask = async () => {
    if (!taskInput.trim()) {
      setError('Введите описание задачи');
      return;
    }
    await handleQuickStart(taskInput);
  };

  return (
    <div className="space-y-6">
      {/* Custom Task Input */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Новая задача</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Опишите вашу задачу для 1С..."
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCustomTask()}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={isProcessing}
          />
          <button
            onClick={handleCustomTask}
            disabled={isProcessing || !taskInput.trim()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Обработка...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Начать
              </>
            )}
          </button>
        </div>
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Quick Start Templates */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-600" />
          Быстрый старт
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleQuickStart(template.task)}
              disabled={isProcessing}
              className="group relative p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-300 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center mb-3`}>
                <template.icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{template.title}</h4>
              <p className="text-sm text-gray-600">{template.description}</p>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="w-5 h-5 text-indigo-600" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
