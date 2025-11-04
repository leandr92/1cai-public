import React, { useState } from 'react';
import { Lightbulb, Play, ArrowRight, Code, Settings, Users } from 'lucide-react';

interface Example {
  id: string;
  title: string;
  description: string;
  agent: string;
  task: string;
  icon: React.ReactNode;
  complexity: 'easy' | 'medium' | 'hard';
  category: string;
  result: string;
}

const examples: Example[] = [
  {
    id: '1',
    title: 'Модуль расчета заработной платы',
    description: 'Создание комплексного модуля для автоматизации расчета заработной платы с учетом всех коэффициентов и премий',
    agent: 'Разработчик',
    task: 'Разработайте модуль для расчета заработной платы сотрудников с учетом окладов, коэффициентов, премий и удержаний.',
    icon: <Code className="w-6 h-6" />,
    complexity: 'medium',
    category: 'HR и кадры',
    result: 'Создан модуль с полной функциональностью расчета, включающий 15+ видов начислений и удержаний'
  },
  {
    id: '2',
    title: 'Архитектура торговой системы',
    description: 'Проектирование комплексной архитектуры для системы управления торговыми операциями',
    agent: 'Архитектор',
    task: 'Спроектируйте архитектуру торговой системы для компании с 50+ магазинами и интеграцией с 1С.',
    icon: <Settings className="w-6 h-6" />,
    complexity: 'hard',
    category: 'Торговля',
    result: 'Разработана масштабируемая архитектура с микросервисным подходом и API-шлюзом'
  },
  {
    id: '3',
    title: 'Автоматизация складских процессов',
    description: 'Консультация по оптимизации и автоматизации складских операций в 1С',
    agent: 'Консультант',
    task: 'Как оптимизировать складские процессы в 1С и снизить время обработки заказов?',
    icon: <Users className="w-6 h-6" />,
    complexity: 'easy',
    category: 'Склад',
    result: 'Предложены решения для сокращения времени обработки на 40% и снижения ошибок на 60%'
  },
  {
    id: '4',
    title: 'Отчет по финансовым показателям',
    description: 'Создание аналитического отчета с автоматическим расчетом ключевых финансовых метрик',
    agent: 'Разработчик',
    task: 'Создайте отчет по финансовым показателям с автоматическим расчетом ROI, рентабельности и трендов.',
    icon: <Code className="w-6 h-6" />,
    complexity: 'medium',
    category: 'Финансы',
    result: 'Создан интерактивный отчет с 20+ показателями и возможностью экспорта в Excel'
  },
  {
    id: '5',
    title: 'Интеграция с внешними API',
    description: 'Архитектурное решение для интеграции 1С с внешними сервисами и API',
    agent: 'Архитектор', 
    task: 'Разработайте план интеграции 1С с внешними сервисами (CRM, ERP, банковские API).',
    icon: <Settings className="w-6 h-6" />,
    complexity: 'hard',
    category: 'Интеграция',
    result: 'Спроектирована надежная система интеграции с обработкой ошибок и масштабированием'
  },
  {
    id: '6',
    title: 'Настройка управленческого учета',
    description: 'Консультация по внедрению системы управленческого учета для малого бизнеса',
    agent: 'Консультант',
    task: 'Как настроить управленческий учет в 1С для торговой компании с несколькими направлениями?',
    icon: <Users className="w-6 h-6" />,
    complexity: 'medium',
    category: 'Учет',
    result: 'Предложена поэтапная схема внедрения с ROI анализом и временными рамками'
  },
  {
    id: '7',
    title: 'Автоматизация документооборота',
    description: 'Создание системы автоматической обработки документов с использованием ИИ',
    agent: 'Разработчик',
    task: 'Разработайте систему автоматической обработки входящих документов с ИИ-распознаванием.',
    icon: <Code className="w-6 h-6" />,
    complexity: 'hard',
    category: 'Документооборот',
    result: 'Реализована система с ИИ-распознаванием, автоматической классификацией и маршрутизацией'
  },
  {
    id: '8',
    title: 'Миграция данных',
    description: 'Архитектурное планирование миграции данных из устаревшей системы в 1С',
    agent: 'Архитектор',
    task: 'Составьте план миграции данных из старой системы в 1С с минимальным простоем.',
    icon: <Settings className="w-6 h-6" />,
    complexity: 'hard',
    category: 'Миграция',
    result: 'Разработан поэтапный план миграции с минимальным простоем и полной валидацией данных'
  },
  {
    id: '9',
    title: 'Обучение пользователей',
    description: 'Планирование программы обучения персонала новым функциям 1С',
    agent: 'Консультант',
    task: 'Разработайте программу обучения пользователей новой версии 1С с учетом разного уровня подготовки.',
    icon: <Users className="w-6 h-6" />,
    complexity: 'easy',
    category: 'Обучение',
    result: 'Создана поэтапная программа обучения с тестированием и сертификацией сотрудников'
  }
];

const ExamplesSection: React.FC = () => {
  const [selectedExample, setSelectedExample] = useState<Example | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(examples.map(ex => ex.category)))];
  
  const filteredExamples = filter === 'all' 
    ? examples 
    : examples.filter(ex => ex.category === filter);

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'hard': return 'text-red-400 bg-red-400/20 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getComplexityText = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'Легко';
      case 'medium': return 'Средне';
      case 'hard': return 'Сложно';
      default: return 'Неизвестно';
    }
  };

  const runExample = (example: Example) => {
    setSelectedExample(example);
    // Переходим к демо-секции
    const demoSection = document.getElementById('demo');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="examples" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок секции */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Готовые <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">сценарии</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Выберите готовый пример задачи для демонстрации возможностей наших ИИ-ассистентов
          </p>

          {/* Фильтры */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === category
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                {category === 'all' ? 'Все категории' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Сетка примеров */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExamples.map((example) => (
            <div
              key={example.id}
              className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105"
            >
              {/* Иконка и метаданные */}
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500`}>
                  <div className="text-white">
                    {example.icon}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-2 py-1 text-xs rounded-full border ${getComplexityColor(example.complexity)}`}>
                    {getComplexityText(example.complexity)}
                  </span>
                  <span className="text-xs text-gray-400">{example.category}</span>
                </div>
              </div>

              {/* Заголовок и описание */}
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                {example.title}
              </h3>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                {example.description}
              </p>

              {/* Агент */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {example.agent.charAt(0)}
                  </span>
                </div>
                <span className="text-purple-300 text-sm font-medium">{example.agent}</span>
              </div>

              {/* Кнопки */}
              <div className="flex space-x-2">
                <button
                  onClick={() => runExample(example)}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-1"
                >
                  <Play className="w-4 h-4" />
                  <span>Запустить</span>
                </button>
                <button
                  onClick={() => setSelectedExample(example)}
                  className="px-4 py-2 border border-white/20 text-gray-300 rounded-lg text-sm hover:border-white/40 hover:text-white transition-all"
                >
                  Подробнее
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Модальное окно с подробностями */}
        {selectedExample && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                {/* Заголовок */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                      <div className="text-white">
                        {selectedExample.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white">{selectedExample.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getComplexityColor(selectedExample.complexity)}`}>
                          {getComplexityText(selectedExample.complexity)}
                        </span>
                        <span className="text-gray-400 text-sm">{selectedExample.category}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedExample(null)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Описание */}
                <div className="mb-6">
                  <p className="text-gray-300 text-lg leading-relaxed">
                    {selectedExample.description}
                  </p>
                </div>

                {/* Задача */}
                <div className="mb-6">
                  <h4 className="text-xl font-bold text-white mb-3">Исходная задача:</h4>
                  <div className="bg-black/20 rounded-lg p-4 border border-purple-500/30">
                    <p className="text-gray-300">{selectedExample.task}</p>
                  </div>
                </div>

                {/* Результат */}
                <div className="mb-8">
                  <h4 className="text-xl font-bold text-white mb-3">Результат:</h4>
                  <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                    <p className="text-green-300">{selectedExample.result}</p>
                  </div>
                </div>

                {/* Кнопка запуска */}
                <div className="text-center">
                  <button
                    onClick={() => {
                      runExample(selectedExample);
                      setSelectedExample(null);
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center space-x-2 mx-auto"
                  >
                    <Play className="w-5 h-5" />
                    <span>Запустить этот пример</span>
                    <ArrowRight className="w-5 h-5" />
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

export default ExamplesSection;