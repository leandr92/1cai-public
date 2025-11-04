import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Code, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp,
  Play,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { AGENT_TASK_EXAMPLES } from '../../data/contentData';

interface AgentDetailsSectionProps {
  selectedAgent: string | null;
  onSelectAgent: (agentId: string | null) => void;
  onTaskSelect: (task: string, agentId: string) => void;
}

export default function AgentDetailsSection({ selectedAgent, onSelectAgent, onTaskSelect }: AgentDetailsSectionProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const agents = [
    {
      id: 'analyze-task',
      name: 'Агент-Аналитик',
      icon: Brain,
      color: 'from-blue-500 to-cyan-500',
      description: 'Профессиональный анализ требований и архитектурное планирование',
      capabilities: [
        'Анализ бизнес-требований и формирование технического задания',
        'Определение архитектуры решения и необходимых модулей 1С',
        'Оценка сложности и трудозатрат проекта',
        'Выявление рисков и формирование рекомендаций',
        'Создание диаграмм и схем взаимодействия компонентов'
      ],
      whenToUse: [
        'Нужно понять, как реализовать сложный бизнес-процесс',
        'Требуется оценка трудозатрат на разработку',
        'Необходимо составить техническое задание',
        'Планируется интеграция с внешними системами'
      ]
    },
    {
      id: 'develop-solution',
      name: 'Агент-Разработчик',
      icon: Code,
      color: 'from-purple-500 to-pink-500',
      description: 'Генерация готового кода 1С по вашим требованиям',
      capabilities: [
        'Генерация кода документов, отчетов, обработок, справочников',
        'Создание модулей объектов, форм, менеджеров',
        'Реализация бизнес-логики и правил проведения',
        'Генерация запросов и схем компоновки данных (СКД)',
        'Создание примеров использования и тестовых сценариев'
      ],
      whenToUse: [
        'Нужен готовый код для документа или отчета',
        'Требуется создать обработку для импорта/экспорта',
        'Необходимо реализовать типовой функционал 1С',
        'Нужны примеры кода для конкретной задачи'
      ]
    },
    {
      id: 'provide-consultation',
      name: 'Агент-Консультант',
      icon: Lightbulb,
      color: 'from-orange-500 to-red-500',
      description: 'Экспертные рекомендации и лучшие практики 1С',
      capabilities: [
        'Best practices разработки и архитектуры 1С',
        'Рекомендации по оптимизации производительности',
        'Советы по безопасности и надежности решений',
        'Чеклисты развертывания и тестирования',
        'Помощь в выборе оптимального подхода к задаче'
      ],
      whenToUse: [
        'Нужны советы по оптимизации существующего кода',
        'Требуется проверка архитектурных решений',
        'Необходимы рекомендации по best practices',
        'Планируется развертывание изменений в продакшн'
      ]
    }
  ];

  const toggleAgentExpansion = (agentId: string) => {
    setExpandedAgent(expandedAgent === agentId ? null : agentId);
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Познакомьтесь с нашими ИИ-агентами
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Каждый агент - это специалист с глубокими знаниями 1С. Выберите нужного или используйте всех последовательно.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {agents.map((agent, index) => {
            const isExpanded = expandedAgent === agent.id;
            const agentExamples = AGENT_TASK_EXAMPLES.find(e => e.agentId === agent.id);

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 hover:border-indigo-300 transition-all overflow-hidden"
              >
                {/* Agent Header */}
                <div className={`p-6 bg-gradient-to-br ${agent.color} text-white`}>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <agent.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold flex-1">{agent.name}</h3>
                  </div>
                  <p className="text-white/90 text-sm">{agent.description}</p>
                </div>

                {/* Agent Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Что умеет:
                    </h4>
                    <ul className="space-y-2">
                      {agent.capabilities.slice(0, 3).map((capability, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-indigo-600 mt-1">•</span>
                          <span>{capability}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Expand Button */}
                  <button
                    onClick={() => toggleAgentExpansion(agent.id)}
                    className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium text-gray-700"
                  >
                    {isExpanded ? 'Скрыть детали' : 'Показать больше'}
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          {/* Full Capabilities */}
                          <h4 className="font-semibold text-gray-900 mb-2 text-sm">Полные возможности:</h4>
                          <ul className="space-y-2 mb-4">
                            {agent.capabilities.map((capability, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{capability}</span>
                              </li>
                            ))}
                          </ul>

                          {/* When to Use */}
                          <h4 className="font-semibold text-gray-900 mb-2 text-sm">Когда использовать:</h4>
                          <ul className="space-y-2 mb-4">
                            {agent.whenToUse.map((use, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                <span>{use}</span>
                              </li>
                            ))}
                          </ul>

                          {/* Example Tasks */}
                          {agentExamples && (
                            <>
                              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Примеры задач:</h4>
                              <div className="space-y-3">
                                {agentExamples.examples.map((example, idx) => (
                                  <div 
                                    key={idx} 
                                    className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <h5 className="font-medium text-gray-900 text-sm flex-1">{example.title}</h5>
                                      <button
                                        onClick={() => onTaskSelect(example.task, agent.id)}
                                        className="ml-2 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                        title="Попробовать эту задачу"
                                      >
                                        <Play className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-2">{example.task}</p>
                                    <div className="text-xs text-gray-500 flex items-start gap-1">
                                      <TrendingUp className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                                      <span>{example.expectedResult}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-indigo-600 mb-2">1,247</div>
            <div className="text-gray-600">Разработчиков используют систему</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">3,592</div>
            <div className="text-gray-600">Задач успешно выполнено</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">~60 сек</div>
            <div className="text-gray-600">Среднее время обработки</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
