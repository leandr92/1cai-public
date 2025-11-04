import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Link } from 'react-router-dom';
import { Users, Building2, Briefcase, ArrowRight, Star } from 'lucide-react';

export default function CasesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                <Users className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Истории успеха
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Узнайте, как компании используют AI Ecosystem 1С для автоматизации разработки
              </p>
            </div>
          </div>
        </section>

        {/* Coming Soon Content */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Briefcase className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Раздел в разработке
                  </h2>
                  <p className="text-lg text-gray-600 mb-6">
                    Мы собираем реальные истории использования нашей платформы компаниями из различных отраслей.
                  </p>
                </div>

                {/* Preview Categories */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-6 bg-gray-50 rounded-xl">
                    <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Розничная торговля</h3>
                    <p className="text-sm text-gray-600">
                      Автоматизация учета и отчетности
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-xl">
                    <Star className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Производство</h3>
                    <p className="text-sm text-gray-600">
                      Управление производственными процессами
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-xl">
                    <Briefcase className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Услуги</h3>
                    <p className="text-sm text-gray-600">
                      Оптимизация бизнес-процессов
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-4">
                    Хотите стать частью наших историй успеха?
                  </p>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Начать использовать
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Stats Preview */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                  <p className="text-4xl font-bold text-blue-600 mb-2">200+</p>
                  <p className="text-gray-600">Компаний</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                  <p className="text-4xl font-bold text-blue-600 mb-2">70%</p>
                  <p className="text-gray-600">Экономия времени</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                  <p className="text-4xl font-bold text-blue-600 mb-2">5000+</p>
                  <p className="text-gray-600">Задач выполнено</p>
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
