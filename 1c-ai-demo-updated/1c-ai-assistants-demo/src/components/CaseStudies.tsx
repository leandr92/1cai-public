import React, { useState } from 'react';
import { Building2, TrendingUp, Clock, DollarSign, Users, ArrowRight, CheckCircle, Target } from 'lucide-react';

interface CaseStudy {
  id: string;
  title: string;
  company: string;
  industry: string;
  challenge: string;
  solution: string;
  results: {
    timeSaved: string;
    costReduction: string;
    efficiency: string;
    users: string;
  };
  icon: React.ReactNode;
  color: string;
  testimonial: string;
  author: string;
  metrics: {
    label: string;
    value: string;
    icon: React.ReactNode;
  }[];
}

const caseStudies: CaseStudy[] = [
  {
    id: '1',
    title: 'Автоматизация складского учета',
    company: 'Торговая компания "Прогресс"',
    industry: 'Розничная торговля',
    challenge: 'Ручной учет товаров, частые ошибки в инвентаризации, потеря товаров, высокие затраты времени на обработку заказов.',
    solution: 'Внедрение модуля автоматизированного складского учета с штрих-кодированием, интеграцией с 1С и ИИ-ассистентом для оптимизации процессов.',
    results: {
      timeSaved: '70%',
      costReduction: '45%',
      efficiency: '300%',
      users: '50+'
    },
    icon: <Building2 className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-500',
    testimonial: 'ИИ-ассистент помог нам кардинально изменить подход к управлению складом. Теперь мы обрабатываем заказы в 3 раза быстрее с минимальными ошибками.',
    author: 'Алексей Иванов, Директор по логистике',
    metrics: [
      { label: 'Ошибок в учете', value: '-90%', icon: <CheckCircle className="w-4 h-4" /> },
      { label: 'Время обработки', value: '-70%', icon: <Clock className="w-4 h-4" /> },
      { label: 'Рентабельность', value: '+200%', icon: <TrendingUp className="w-4 h-4" /> },
      { label: 'Точность данных', value: '99.8%', icon: <Target className="w-4 h-4" /> }
    ]
  },
  {
    id: '2',
    title: 'Оптимизация финансовых процессов',
    company: 'Группа компаний "Финансы+"',
    industry: 'Финансовые услуги',
    challenge: 'Медленное закрытие месяца, сложности с анализом данных, дублирование функций в разных системах.',
    solution: 'Создание комплексной системы финансового учета с ИИ-аналитикой, автоматизацией закрытия периода и консолидацией данных.',
    results: {
      timeSaved: '60%',
      costReduction: '35%',
      efficiency: '250%',
      users: '25+'
    },
    icon: <DollarSign className="w-6 h-6" />,
    color: 'from-green-500 to-emerald-500',
    testimonial: 'Процесс закрытия месяца сократился с 5 дней до 2. ИИ-ассистент автоматически находит несоответствия и предлагает решения.',
    author: 'Мария Петрова, Главный бухгалтер',
    metrics: [
      { label: 'Время закрытия', value: '-60%', icon: <Clock className="w-4 h-4" /> },
      { label: 'Экономия средств', value: '$50K/год', icon: <DollarSign className="w-4 h-4" /> },
      { label: 'Автоматизация', value: '85%', icon: <CheckCircle className="w-4 h-4" /> },
      { label: 'Точность отчетов', value: '99.9%', icon: <Target className="w-4 h-4" /> }
    ]
  },
  {
    id: '3',
    title: 'Цифровизация HR-процессов',
    company: 'Технологическая компания "Инновейт"',
    industry: 'IT и разработка',
    challenge: 'Бумажный документооборот, сложности с расчетом зарплат, отсутствие аналитики по персоналу.',
    solution: 'Полная цифровизация HR-процессов с автоматизацией расчета зарплат, созданием дашбордов и ИИ-аналитикой кадровых данных.',
    results: {
      timeSaved: '80%',
      costReduction: '40%',
      efficiency: '400%',
      users: '200+'
    },
    icon: <Users className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
    testimonial: 'ИИ-ассистент полностью изменил наш подход к управлению персоналом. Теперь у нас есть вся аналитика в реальном времени.',
    author: 'Елена Сидорова, HR-директор',
    metrics: [
      { label: 'Автоматизация HR', value: '90%', icon: <CheckCircle className="w-4 h-4" /> },
      { label: 'Экономия времени', value: '-80%', icon: <Clock className="w-4 h-4" /> },
      { label: 'Рост продуктивности', value: '+150%', icon: <TrendingUp className="w-4 h-4" /> },
      { label: 'Сотрудников', value: '200+', icon: <Users className="w-4 h-4" /> }
    ]
  }
];

const CaseStudies: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);

  return (
    <section id="cases" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок секции */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Успешные <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">кейсы</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Реальные примеры внедрения наших ИИ-ассистентов с измеримыми результатами
          </p>
        </div>

        {/* Кейсы */}
        <div className="space-y-8">
          {caseStudies.map((caseStudy, index) => (
            <div
              key={caseStudy.id}
              className={`bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-purple-500/50 transition-all duration-300 ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} lg:flex lg:items-center lg:space-x-8`}
            >
              {/* Левая колонка - Описание */}
              <div className="lg:w-2/3 mb-8 lg:mb-0">
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${caseStudy.color}`}>
                    <div className="text-white">
                      {caseStudy.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{caseStudy.title}</h3>
                    <p className="text-gray-400">{caseStudy.company} • {caseStudy.industry}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Проблема:</h4>
                    <p className="text-gray-300">{caseStudy.challenge}</p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Решение:</h4>
                    <p className="text-gray-300">{caseStudy.solution}</p>
                  </div>
                </div>

                {/* Отзыв */}
                <div className="mt-6 bg-black/20 rounded-lg p-4 border-l-4 border-purple-500">
                  <p className="text-gray-300 italic mb-3">"{caseStudy.testimonial}"</p>
                  <p className="text-purple-300 font-medium">— {caseStudy.author}</p>
                </div>

                {/* Метрики */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  {caseStudy.metrics.map((metric, metricIndex) => (
                    <div key={metricIndex} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="text-purple-400">
                          {metric.icon}
                        </div>
                        <div className="text-sm text-gray-400">{metric.label}</div>
                      </div>
                      <div className="text-2xl font-bold text-white">{metric.value}</div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setSelectedCase(caseStudy)}
                  className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
                >
                  <span>Подробнее</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Правая колонка - Результаты */}
              <div className="lg:w-1/3">
                <div className="bg-gradient-to-br from-black/20 to-white/5 rounded-xl p-6 border border-white/10">
                  <h4 className="text-xl font-bold text-white mb-6 text-center">Результаты внедрения</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <span className="text-gray-300">Экономия времени</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-400">{caseStudy.results.timeSaved}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <span className="text-gray-300">Снижение затрат</span>
                      </div>
                      <span className="text-2xl font-bold text-green-400">{caseStudy.results.costReduction}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                        <span className="text-gray-300">Рост эффективности</span>
                      </div>
                      <span className="text-2xl font-bold text-purple-400">{caseStudy.results.efficiency}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-orange-400" />
                        <span className="text-gray-300">Пользователей</span>
                      </div>
                      <span className="text-2xl font-bold text-orange-400">{caseStudy.results.users}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Модальное окно с деталями кейса */}
        {selectedCase && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                {/* Заголовок */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${selectedCase.color}`}>
                      <div className="text-white">
                        {selectedCase.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white">{selectedCase.title}</h3>
                      <p className="text-gray-400">{selectedCase.company} • {selectedCase.industry}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCase(null)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Детальное описание */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xl font-bold text-white mb-4">Детали проекта</h4>
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-semibold text-gray-300 mb-2">Вызов:</h5>
                        <p className="text-gray-300">{selectedCase.challenge}</p>
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-300 mb-2">Решение:</h5>
                        <p className="text-gray-300">{selectedCase.solution}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xl font-bold text-white mb-4">Внедренные модули</h4>
                    <div className="space-y-2">
                      {[
                        'ИИ-ассистент Разработчик',
                        'Модуль автоматизации процессов', 
                        'Система аналитики и отчетности',
                        'Интеграция с существующими системами',
                        'Обучение пользователей'
                      ].map((module, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-gray-300">{module}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Отзыв */}
                <div className="mt-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
                  <h4 className="text-xl font-bold text-white mb-4">Отзыв клиента</h4>
                  <p className="text-gray-300 text-lg italic mb-4">"{selectedCase.testimonial}"</p>
                  <p className="text-purple-300 font-medium">— {selectedCase.author}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CaseStudies;