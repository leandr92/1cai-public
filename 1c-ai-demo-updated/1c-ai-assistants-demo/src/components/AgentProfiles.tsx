import React, { useState } from 'react';
import { 
  User, 
  Code, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  FileText, 
  Database, 
  TrendingUp,
  CheckCircle
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: React.ReactNode;
  specialties: string[];
  examples: string[];
  capabilities: string[];
  color: string;
}

const agents: Agent[] = [
  {
    id: 'develop-solution',
    name: 'Разработчик',
    role: 'Специалист по коду и архитектуре',
    description: 'Создает качественный код 1С, оптимизирует производительность и внедряет лучшие практики разработки.',
    icon: <Code className="w-8 h-8" />,
    specialties: ['Написание кода 1С', 'Оптимизация производительности', 'Архитектурные решения'],
    examples: [
      'Создание модуля для расчета заработной платы',
      'Оптимизация запросов к справочникам',
      'Разработка API для интеграции с внешними системами'
    ],
    capabilities: [
      'Написание модулей 1С на встроенном языке',
      'Создание отчетов и обработок',
      'Проектирование архитектуры системы',
      'Оптимизация SQL-запросов',
      'Создание внешних компонент'
    ],
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'analyze-task',
    name: 'Архитектор',
    role: 'Системный архитектор решений 1С',
    description: 'Проектирует архитектуру систем 1С, анализирует требования и создает техническую документацию.',
    icon: <Settings className="w-8 h-8" />,
    specialties: ['Архитектурное проектирование', 'Анализ требований', 'Техническая документация'],
    examples: [
      'Проектирование архитектуры торговой системы',
      'Создание технического задания',
      'Анализ рисков миграции данных'
    ],
    capabilities: [
      'Проектирование архитектуры 1С-систем',
      'Создание технических спецификаций',
      'Анализ производительности систем',
      'Планирование миграции данных',
      'Разработка стандартов разработки'
    ],
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'provide-consultation',
    name: 'Консультант',
    role: 'Бизнес-аналитик и консультант',
    description: 'Анализирует бизнес-процессы, консультирует по настройке 1С и помогает оптимизировать работу.',
    icon: <MessageSquare className="w-8 h-8" />,
    specialties: ['Бизнес-анализ', 'Консультации по 1С', 'Оптимизация процессов'],
    examples: [
      'Настройка системы оплаты в 1С',
      'Консультация по автоматизации склада',
      'Анализ эффективности бизнес-процессов'
    ],
    capabilities: [
      'Анализ бизнес-процессов',
      'Консультации по настройке 1С',
      'Обучение пользователей',
      'Оптимизация работы с системой',
      'Подготовка рекомендаций'
    ],
    color: 'from-green-500 to-emerald-500'
  }
];

const AgentProfiles: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  return (
    <section id="agents" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок секции */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Наши <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">ИИ-агенты</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Каждый агент специализируется на определенных задачах и готов помочь решить самые сложные вопросы
          </p>
        </div>

        {/* Карточки агентов */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`group bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-purple-500/50 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-2xl`}
              onClick={() => setSelectedAgent(agent)}
            >
              {/* Иконка и название */}
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${agent.color} mb-6`}>
                <div className="text-white">
                  {agent.icon}
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">{agent.name}</h3>
              <p className="text-purple-300 text-sm font-medium mb-4">{agent.role}</p>
              <p className="text-gray-300 mb-6 leading-relaxed">{agent.description}</p>

              {/* Специализации */}
              <div className="space-y-2">
                {agent.specialties.map((specialty, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">{specialty}</span>
                  </div>
                ))}
              </div>

              {/* Кнопка подробнее */}
              <button className="mt-6 w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white py-3 rounded-lg border border-purple-500/30 hover:border-purple-400 transition-all duration-300">
                Подробнее
              </button>
            </div>
          ))}
        </div>

        {/* Модальное окно с деталями агента */}
        {selectedAgent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                {/* Заголовок модального окна */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${selectedAgent.color}`}>
                      <div className="text-white">
                        {selectedAgent.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white">{selectedAgent.name}</h3>
                      <p className="text-purple-300">{selectedAgent.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAgent(null)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Описание */}
                <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                  {selectedAgent.description}
                </p>

                {/* Возможности */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xl font-bold text-white mb-4 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
                      Возможности
                    </h4>
                    <div className="space-y-3">
                      {selectedAgent.capabilities.map((capability, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{capability}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xl font-bold text-white mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-400" />
                      Примеры задач
                    </h4>
                    <div className="space-y-3">
                      {selectedAgent.examples.map((example, index) => (
                        <div key={index} className="bg-white/10 rounded-lg p-4 border border-white/20">
                          <p className="text-gray-300">{example}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Кнопка тестирования */}
                <div className="mt-8 text-center">
                  <button
                    onClick={() => {
                      const demoSection = document.getElementById('demo');
                      if (demoSection) {
                        demoSection.scrollIntoView({ behavior: 'smooth' });
                        setSelectedAgent(null);
                      }
                    }}
                    className={`bg-gradient-to-r ${selectedAgent.color} text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300`}
                  >
                    Протестировать {selectedAgent.name}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AgentProfiles;