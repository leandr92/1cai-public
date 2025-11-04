import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, 
  Book, 
  MessageCircle, 
  Mail, 
  ArrowRight,
  Search,
  FileQuestion,
  LifeBuoy
} from 'lucide-react';

export default function HelpPage() {
  const faqs = [
    {
      question: 'Как начать работу с AI Ecosystem 1С?',
      answer: 'Зарегистрируйтесь, войдите в Dashboard и создайте первую задачу. ИИ-агенты автоматически обработают её.'
    },
    {
      question: 'Сколько времени занимает обработка задачи?',
      answer: 'В среднем 3-7 секунд. Вы можете отслеживать прогресс в реальном времени на Dashboard.'
    },
    {
      question: 'Какие типы задач поддерживаются?',
      answer: 'Отчеты, документы, обработки данных, интеграции, справочники и другие объекты 1С.'
    },
    {
      question: 'Можно ли редактировать сгенерированный код?',
      answer: 'Да, весь код доступен для редактирования и адаптации под ваши нужды.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-green-50 to-teal-50 py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <HelpCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Центр помощи
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Ответы на ваши вопросы и полная документация по использованию системы
              </p>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-2 flex items-center gap-3">
                  <Search className="w-6 h-6 text-gray-400 ml-2" />
                  <input
                    type="text"
                    placeholder="Поиск по документации..."
                    className="flex-1 px-4 py-3 border-0 focus:ring-0 focus:outline-none"
                    disabled
                  />
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  Поиск будет доступен после добавления документации
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-12 bg-white border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                to="/docs"
                className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Book className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-green-600">
                    Документация
                  </h3>
                  <p className="text-sm text-gray-600">
                    Полное руководство пользователя
                  </p>
                </div>
              </Link>

              <a
                href="mailto:support@example.com"
                className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600">
                    Email поддержка
                  </h3>
                  <p className="text-sm text-gray-600">
                    support@example.com
                  </p>
                </div>
              </a>

              <Link
                to="/contact"
                className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-purple-600">
                    Онлайн чат
                  </h3>
                  <p className="text-sm text-gray-600">
                    Быстрые ответы от команды
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Часто задаваемые вопросы
                </h2>
                <p className="text-gray-600">
                  Ответы на самые популярные вопросы о системе
                </p>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileQuestion className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {faq.question}
                        </h3>
                        <p className="text-gray-600">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-12 bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-8 text-center">
                <LifeBuoy className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Не нашли ответ?
                </h3>
                <p className="text-gray-600 mb-6">
                  Наша команда поддержки готова помочь вам
                </p>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Попробовать систему
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
