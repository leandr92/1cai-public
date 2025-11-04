import React, { useState } from 'react';
import { Send, Bot, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface DemoRequest {
  id: string;
  agentId: string;
  task: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: string;
  createdAt: Date;
}

const DemoSection: React.FC = () => {
  const [task, setTask] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('develop-solution');
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const agents = [
    {
      id: 'develop-solution',
      name: 'Разработчик',
      icon: '💻',
      description: 'Написание кода и оптимизация'
    },
    {
      id: 'analyze-task', 
      name: 'Архитектор',
      icon: '🏗️',
      description: 'Проектирование и архитектура'
    },
    {
      id: 'provide-consultation',
      name: 'Консультант', 
      icon: '💼',
      description: 'Бизнес-консультации'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;

    setIsSubmitting(true);
    
    const newRequest: DemoRequest = {
      id: Date.now().toString(),
      agentId: selectedAgent,
      task: task.trim(),
      status: 'processing',
      createdAt: new Date()
    };

    setRequests(prev => [newRequest, ...prev]);

    try {
      // Имитация вызова API
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      // Симуляция успешного результата
      const agent = agents.find(a => a.id === selectedAgent);
      const responses = {
        'develop-solution': `✅ **Результат от ${agent?.name}:**
        
Создан оптимизированный код для вашей задачи:
- Модуль обработки: "Модуль_${task.substring(0, 20).replace(/\\s+/g, '_')}"
- Производительность: +40% быстрее
- Память: -25% потребления
- Готов к внедрению в продакшн

Технические детали:
- Использует современные паттерны 1С
- Включает обработку ошибок
- Соответствует стандартам качества`,
        
        'analyze-task': `📋 **Архитектурное решение от ${agent?.name}:**

Проанализирована задача и подготовлено решение:
- Архитектурная схема: ✓ Создана
- Компоненты: 5 модулей определены
- Интеграции: 3 внешних системы
- Риски: Выявлено 2, предложены решения

Временные рамки: 2-3 недели
Ресурсы: 1 архитектор + 2 разработчика`,
        
        'provide-consultation': `💼 **Консультация от ${agent?.name}:**

Детальный анализ вашей задачи:
- Бизнес-процесс: Проанализирован
- Лучшие практики: Применены
- Эффективность: +60% улучшение
- Рекомендации: 5 ключевых точек

ROI проекта: 300% за 6 месяцев
Конкретные шаги: 8 действий`
      };

      const response = responses[selectedAgent as keyof typeof responses];

      setRequests(prev => prev.map(req => 
        req.id === newRequest.id 
          ? { ...req, status: 'completed', result: response }
          : req
      ));

    } catch (error) {
      setRequests(prev => prev.map(req => 
        req.id === newRequest.id 
          ? { ...req, status: 'error', result: 'Произошла ошибка при обработке запроса' }
          : req
      ));
    } finally {
      setIsSubmitting(false);
      setTask('');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Bot className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'В очереди';
      case 'processing': return 'Обработка...';
      case 'completed': return 'Завершено';
      case 'error': return 'Ошибка';
      default: return 'Неизвестно';
    }
  };

  return (
    <section id="demo" className="py-20 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок секции */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Интерактивная <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">демонстрация</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Опишите вашу задачу, выберите агента и получите детальное решение в реальном времени
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Левая колонка - Форма */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Bot className="w-6 h-6 mr-3 text-purple-400" />
              Создать новую задачу
            </h3>

            {/* Выбор агента */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Выберите агента:
              </label>
              <div className="grid grid-cols-1 gap-3">
                {agents.map((agent) => (
                  <label
                    key={agent.id}
                    className={`relative flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedAgent === agent.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/20 hover:border-white/40 bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="agent"
                      value={agent.id}
                      checked={selectedAgent === agent.id}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{agent.icon}</span>
                      <div>
                        <div className="text-white font-medium">{agent.name}</div>
                        <div className="text-gray-400 text-sm">{agent.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Форма задачи */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="task" className="block text-sm font-medium text-gray-300 mb-2">
                  Опишите вашу задачу:
                </label>
                <textarea
                  id="task"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="Например: Создайте модуль для расчета заработной платы сотрудников с учетом коэффициентов и премий..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  disabled={isSubmitting}
                />
              </div>
              
              <button
                type="submit"
                disabled={!task.trim() || isSubmitting}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Отправка...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Запустить агента</span>
                  </>
                )}
              </button>
            </form>

            {/* Тестовые задачи */}
            <div className="mt-8">
              <p className="text-sm text-gray-400 mb-3">Быстрые примеры:</p>
              <div className="space-y-2">
                {[
                  "Создать справочник товаров с иерархией",
                  "Разработать отчет по продажам за месяц", 
                  "Настроить автоматическое списание товаров",
                  "Создать модуль управления заказами"
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setTask(example)}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Правая колонка - Результаты */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <CheckCircle className="w-6 h-6 mr-3 text-green-400" />
              Результаты
            </h3>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {requests.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Результаты появятся здесь после отправки задачи</p>
                </div>
              ) : (
                requests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white/10 rounded-lg p-4 border border-white/20"
                  >
                    {/* Заголовок результата */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        <span className="text-white font-medium">
                          {agents.find(a => a.id === request.agentId)?.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {getStatusText(request.status)}
                      </span>
                    </div>

                    {/* Задача */}
                    <div className="mb-3">
                      <p className="text-gray-300 text-sm">{request.task}</p>
                    </div>

                    {/* Результат */}
                    {request.status === 'completed' && request.result && (
                      <div className="bg-black/20 rounded-lg p-4 border border-green-500/30">
                        <div className="prose prose-invert prose-sm max-w-none">
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: request.result.replace(/\\n/g, '<br>').replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
                            }} 
                          />
                        </div>
                      </div>
                    )}

                    {request.status === 'error' && (
                      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                        <p className="text-red-300 text-sm">{request.result}</p>
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      {request.createdAt.toLocaleTimeString('ru-RU')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;