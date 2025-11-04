import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Link } from 'react-router-dom';
import { Zap, Play, ArrowRight, Code, BarChart, FileText } from 'lucide-react';

export default function DemoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-indigo-50 to-purple-50 py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-6">
                <Play className="w-10 h-10 text-indigo-600" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Интерактивная демонстрация
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Попробуйте все возможности AI Ecosystem 1С прямо сейчас
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                <Zap className="w-5 h-5" />
                Начать демо
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Coming Soon Content */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                    <Code className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Раздел в разработке
                  </h2>
                  <p className="text-lg text-gray-600 mb-6">
                    Мы работаем над созданием полноценной интерактивной демонстрации всех возможностей системы.
                  </p>
                </div>

                {/* Preview Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-6 bg-gray-50 rounded-xl">
                    <BarChart className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Анализ задач</h3>
                    <p className="text-sm text-gray-600">
                      Посмотрите как ИИ анализирует требования
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-xl">
                    <Code className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Генерация кода</h3>
                    <p className="text-sm text-gray-600">
                      Наблюдайте за созданием решений 1С
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-xl">
                    <FileText className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Консультации</h3>
                    <p className="text-sm text-gray-600">
                      Получайте рекомендации от ИИ
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-4">
                    А пока вы можете попробовать систему в действии:
                  </p>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Перейти в Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
