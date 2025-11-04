import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AgentDetailsSection from '../components/home/AgentDetailsSection';
import FAQSection from '../components/home/FAQSection';
import SuccessCasesSection from '../components/home/SuccessCasesSection';
import { 
  Bot, 
  FileText, 
  BarChart, 
  Settings, 
  DollarSign,
  CheckCircle,
  Zap,
  Sparkles,
  Edit3,
  CheckSquare,
  ArrowRight,
  Brain,
  Code,
  Lightbulb
} from 'lucide-react';

interface PopularTask {
  id: string;
  icon_name: string;
  text: string;
  category: string;
  order_index: number;
}

interface ExampleResult {
  id: string;
  title: string;
  description: string;
  preview: string;
  time: string;
  order_index: number;
}

const getIconComponent = (iconName: string) => {
  const icons: { [key: string]: React.ComponentType<any> } = {
    FileText,
    BarChart,
    Settings,
    DollarSign,
  };
  return icons[iconName] || FileText;
};

export default function HomePageV2() {
  const [taskInput, setTaskInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [popularTasks, setPopularTasks] = useState<PopularTask[]>([]);
  const [exampleResults, setExampleResults] = useState<ExampleResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadPopularTasks();
    loadExampleResults();
  }, []);

  const loadPopularTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('popular_tasks')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      if (data) setPopularTasks(data);
    } catch (err) {
      console.error('Error loading popular tasks:', err);
    }
  };

  const loadExampleResults = async () => {
    try {
      const { data, error } = await supabase
        .from('example_results')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      if (data) setExampleResults(data);
    } catch (err) {
      console.error('Error loading example results:', err);
    }
  };

  const handleSubmit = async (task: string) => {
    if (!task.trim()) {
      setError('Пожалуйста, введите описание задачи');
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const requestBody: any = {
        user_task: task.trim(),
        user_id: user.id,
        demo_type: 'quick'
      };

      // Если выбран конкретный агент, добавляем параметры для single agent mode
      if (selectedAgent) {
        requestBody.selected_agent = selectedAgent;
      }

      const { data, error: functionError } = await supabase.functions.invoke('workflow-orchestrator', {
        body: requestBody,
      });

      if (functionError) {
        throw new Error(functionError.message || 'Не удалось запустить демонстрацию');
      }

      if (!data || !data.success) {
        throw new Error(data?.error?.message || 'Неожиданный ответ от сервера');
      }

      setSuccess('Задача успешно запущена! Переход на дашборд...');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Error starting demo:', err);
      
      let errorMessage = 'Произошла ошибка при запуске задачи';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.error?.message) {
        errorMessage = err.error.message;
      }
      
      if (errorMessage.includes('fetch')) {
        errorMessage = 'Ошибка сети. Проверьте интернет-соединение и попробуйте снова.';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Превышено время ожидания. Попробуйте еще раз.';
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
        errorMessage = 'Ошибка авторизации. Пожалуйста, войдите в систему снова.';
        setTimeout(() => navigate('/login'), 2000);
      }
      
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10"></div>
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative container mx-auto px-4 py-20 lg:py-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="inline-block mb-6"
              >
                <Bot className="w-20 h-20 text-indigo-600 mx-auto animate-bounce" />
              </motion.div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
                ИИ-Помощник для 1С
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  за 60 секунд
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
                Создавайте документы, отчеты и решения в 1С с помощью реальных ИИ-агентов
              </p>

              {/* Agent Selector */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="max-w-5xl mx-auto mb-8"
              >
                <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                  Выберите агента (опционально):
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'analyze-task',
                      name: 'Агент-аналитик',
                      icon: Brain,
                      description: 'Анализирует вашу задачу и формирует архитектуру решения',
                      color: 'from-blue-500 to-cyan-500'
                    },
                    {
                      id: 'develop-solution',
                      name: 'Агент-разработчик',
                      icon: Code,
                      description: 'Генерирует готовый код 1С на основе требований',
                      color: 'from-purple-500 to-pink-500'
                    },
                    {
                      id: 'provide-consultation',
                      name: 'Агент-консультант',
                      icon: Lightbulb,
                      description: 'Предоставляет рекомендации и лучшие практики для 1С',
                      color: 'from-orange-500 to-red-500'
                    }
                  ].map((agent) => (
                    <motion.button
                      key={agent.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                      className={`p-5 rounded-xl border-2 transition-all text-left ${
                        selectedAgent === agent.id
                          ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${agent.color} text-white`}>
                          <agent.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                            {agent.name}
                            {selectedAgent === agent.id && (
                              <CheckCircle className="w-5 h-5 text-indigo-600" />
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">{agent.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
                {selectedAgent && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 text-center text-sm text-indigo-600 font-medium"
                  >
                    Будет использован только выбранный агент
                  </motion.div>
                )}
                {!selectedAgent && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 text-center text-sm text-gray-500"
                  >
                    Без выбора будут использованы все агенты последовательно
                  </motion.div>
                )}
              </motion.div>

              {/* Unified Input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="max-w-3xl mx-auto mb-8"
              >
                <div className="bg-white rounded-2xl shadow-2xl p-3 border-2 border-transparent hover:border-indigo-200 transition-all">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      ref={taskInputRef}
                      type="text"
                      placeholder="Опишите вашу задачу для 1С..."
                      value={taskInput}
                      onChange={(e) => setTaskInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmit(taskInput)}
                      className="flex-1 px-6 py-4 text-lg border-0 focus:ring-0 focus:outline-none rounded-xl"
                      disabled={isProcessing}
                    />
                    <button
                      onClick={() => handleSubmit(taskInput)}
                      disabled={isProcessing || !taskInput.trim()}
                      className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Обработка...
                        </span>
                      ) : (
                        <>
                          Начать
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {success}
                  </motion.div>
                )}

                {popularTasks.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    <span className="text-sm text-gray-500 mr-2">Популярные:</span>
                    {popularTasks.map((task, index) => {
                      const IconComponent = getIconComponent(task.icon_name);
                      return (
                        <motion.button
                          key={task.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                          onClick={() => handleSubmit(task.text)}
                          className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                        >
                          <IconComponent className="w-4 h-4" />
                          {task.text}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col md:flex-row items-center justify-center gap-8 text-sm text-gray-600"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <strong className="text-gray-900">Реальные ИИ-агенты</strong> - никакой симуляции
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-500" />
                  Среднее время: <strong className="text-gray-900">60 секунд</strong>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Agent Details Section */}
        <AgentDetailsSection
          selectedAgent={selectedAgent}
          onSelectAgent={setSelectedAgent}
          onTaskSelect={handleTaskSelect}
        />

        {/* Success Cases Section */}
        <SuccessCasesSection />

        {/* How it Works */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Как это работает
              </h2>
              <p className="text-xl text-gray-600">
                Реальные ИИ-агенты работают над вашей задачей
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: 'Опишите задачу',
                  description: 'Агент-аналитик анализирует ваши требования и определяет архитектуру решения',
                  icon: Edit3,
                },
                {
                  step: '2',
                  title: 'ИИ создает решение',
                  description: 'Агент-разработчик генерирует код 1С на основе анализа',
                  icon: Sparkles,
                },
                {
                  step: '3',
                  title: 'Получите результат',
                  description: 'Готовое решение с кодом, рекомендациями и примерами',
                  icon: CheckSquare,
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                    {item.step}
                  </div>
                  <item.icon className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQSection />

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Готовы попробовать?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Начните экономить время уже сегодня с реальными ИИ-агентами
              </p>
              <button
                onClick={() => user ? navigate('/dashboard') : navigate('/login')}
                className="px-12 py-5 bg-white text-indigo-600 font-bold text-lg rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all inline-flex items-center gap-3"
              >
                {user ? 'Перейти в Dashboard' : 'Начать работу'}
                <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
