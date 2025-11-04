import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MessageCircle, Clock, Shield, Zap } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon: React.ReactNode;
}

const faqItems: FAQItem[] = [
  {
    id: '1',
    question: 'Как начать работу с ИИ-ассистентами?',
    answer: 'Просто опишите вашу задачу и выберите подходящего агента. ИИ-ассистент автоматически проанализирует запрос и предложит решение. Для лучших результатов используйте конкретные и детальные описания задач.',
    category: 'Начало работы',
    icon: <Zap className="w-5 h-5" />
  },
  {
    id: '2',
    question: 'Какие типы задач могут решать ИИ-ассистенты?',
    answer: 'Наши агенты специализируются на различных задачах 1С: разработка модулей (Разработчик), архитектурное проектирование (Архитектор), бизнес-консультации (Консультант). Каждый агент имеет глубокую экспертизу в своей области.',
    category: 'Возможности',
    icon: <HelpCircle className="w-5 h-5" />
  },
  {
    id: '3',
    question: 'Как долго длится выполнение задачи?',
    answer: 'Время выполнения зависит от сложности задачи. Простые задачи решаются за 1-2 минуты, сложные проекты могут занимать 10-15 минут. Система показывает прогресс выполнения в реальном времени.',
    category: 'Время выполнения',
    icon: <Clock className="w-5 h-5" />
  },
  {
    id: '4',
    question: 'Безопасны ли передаваемые данные?',
    answer: 'Да, мы обеспечиваем полную безопасность данных. Все информация передается по зашифрованным каналам и не сохраняется на наших серверах после завершения сессии. Система соответствует международным стандартам безопасности.',
    category: 'Безопасность',
    icon: <Shield className="w-5 h-5" />
  },
  {
    id: '5',
    question: 'Можно ли интегрировать ИИ-ассистентов с существующими системами 1С?',
    answer: 'Да, наши решения легко интегрируются с любыми версиями 1С:Предприятие. Поддерживаются как облачные, так и локальные инсталляции. У нас есть готовые модули для популярных конфигураций.',
    category: 'Интеграция',
    icon: <MessageCircle className="w-5 h-5" />
  },
  {
    id: '6',
    question: 'Какая стоимость использования?',
    answer: 'Мы предлагаем гибкие тарифные планы. Базовый план включает 100 задач в месяц, корпоративный план неограниченное количество задач с приоритетной поддержкой. Для крупных проектов предоставляем индивидуальные условия.',
    category: 'Тарифы',
    icon: <MessageCircle className="w-5 h-5" />
  },
  {
    id: '7',
    question: 'Поддерживается ли обучение пользователей?',
    answer: 'Да, мы предоставляем полное обучение команды работе с ИИ-ассистентами. Включает вебинары, документацию, примеры использования и персональные консультации для оптимизации рабочих процессов.',
    category: 'Обучение',
    icon: <HelpCircle className="w-5 h-5" />
  },
  {
    id: '8',
    question: 'Что делать, если результат не соответствует ожиданиям?',
    answer: 'Можно уточнить задачу или перезапустить с более детальным описанием. Наша система учитывает контекст предыдущих взаимодействий. Также доступна техническая поддержка для решения сложных вопросов.',
    category: 'Техподдержка',
    icon: <Shield className="w-5 h-5" />
  },
  {
    id: '9',
    question: 'Можно ли настроить ИИ-ассистента под специфику компании?',
    answer: 'Да, мы предлагаем кастомизацию агентов под ваши бизнес-процессы. Можно загрузить корпоративные стандарты, шаблоны документов и специфическую терминологию для более точных результатов.',
    category: 'Кастомизация',
    icon: <Zap className="w-5 h-5" />
  },
  {
    id: '10',
    question: 'Есть ли API для интеграции с внешними системами?',
    answer: 'Да, мы предоставляем REST API для интеграции с вашими системами. Доступна автоматизация через веб-хуки, поддержка массовых операций и интеграция с системами CI/CD для автоматической разработки.',
    category: 'API',
    icon: <MessageCircle className="w-5 h-5" />
  }
];

const categories = ['Все', ...Array.from(new Set(faqItems.map(item => item.category)))];

const FAQ: React.FC = () => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState('Все');

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const filteredItems = selectedCategory === 'Все' 
    ? faqItems 
    : faqItems.filter(item => item.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    const item = faqItems.find(i => i.category === category);
    return item?.icon || <HelpCircle className="w-4 h-4" />;
  };

  return (
    <section id="faq" className="py-20 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок секции */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Часто задаваемые <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">вопросы</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Ответы на популярные вопросы о работе с ИИ-ассистентами для 1С
          </p>
        </div>

        {/* Фильтры по категориям */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              {category !== 'Все' && getCategoryIcon(category)}
              <span>{category}</span>
            </button>
          ))}
        </div>

        {/* Список вопросов */}
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between focus:outline-none"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.question}</h3>
                    <span className="text-sm text-purple-300">{item.category}</span>
                  </div>
                </div>
                <div className="text-gray-400">
                  {openItems.has(item.id) ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </button>

              {openItems.has(item.id) && (
                <div className="px-6 pb-4">
                  <div className="pl-12">
                    <p className="text-gray-300 leading-relaxed">{item.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Дополнительная информация */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/30 text-center">
            <MessageCircle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Техподдержка</h3>
            <p className="text-gray-300 text-sm mb-4">Круглосуточная поддержка пользователей</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors">
              Связаться
            </button>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30 text-center">
            <HelpCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Обучение</h3>
            <p className="text-gray-300 text-sm mb-4">Вебинары и документация</p>
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors">
              Начать обучение
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30 text-center">
            <Shield className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Безопасность</h3>
            <p className="text-gray-300 text-sm mb-4">Сертификаты и стандарты</p>
            <button className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600 transition-colors">
              Узнать больше
            </button>
          </div>
        </div>

        {/* Контактная информация */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-8 border border-purple-500/30">
            <h3 className="text-2xl font-bold text-white mb-4">Не нашли ответ на свой вопрос?</h3>
            <p className="text-gray-300 mb-6">
              Наша команда экспертов готова помочь вам с любыми вопросами по использованию ИИ-ассистентов
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-xl transition-all duration-300">
                Задать вопрос
              </button>
              <button className="border border-purple-500 text-purple-300 px-6 py-3 rounded-lg font-semibold hover:bg-purple-500/20 transition-all duration-300">
                Заказать демонстрацию
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;