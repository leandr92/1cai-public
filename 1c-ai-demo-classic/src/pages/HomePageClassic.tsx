import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, Code, BarChart3, FileText, Users, Zap, Target } from 'lucide-react';
import { getRoleData } from '../data/demoContent';
import CustomScenarioSection from '../components/CustomScenarioSection';

const allRoleData = {
  architect: getRoleData('architect'),
  developer: getRoleData('developer'),
  pm: getRoleData('pm'),
  ba: getRoleData('ba'),
  'data-analyst': getRoleData('data-analyst')
};

const HomePageClassic: React.FC = () => {
  const navigate = useNavigate();

  const handleRoleClick = (roleId: string) => {
    navigate(`/role/${roleId}`);
  };

  const features = [
    {
      icon: Brain,
      title: 'ИИ-ассистенты',
      description: '5 специализированных ролей для разных задач разработки 1С',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Code,
      title: 'Интерактивные демо',
      description: 'Реальные сценарии с пошаговым выполнением и результатами',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: BarChart3,
      title: 'Экспорт данных',
      description: 'Сохранение результатов в JSON, TXT и PDF форматах',
      color: 'from-purple-500 to-violet-500'
    },
    {
      icon: Zap,
      title: 'Содержательные результаты',
      description: 'Реальный код 1С, архитектурные схемы, отчеты',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        
        {/* Анимированные элементы фона */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mr-4">
                <Brain className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="hero-title text-5xl sm:text-6xl font-bold mb-4">
                  ИИ-ассистенты для 1С
                </h1>
                <p className="text-slate-300 text-xl max-w-3xl mx-auto">
                  Интерактивная демонстрация возможностей ИИ-ассистентов для разработки и сопровождения 
                  решений на платформе 1С:Предприятие
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-8 text-sm text-slate-400">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>5 ролей ассистентов</span>
              </div>
              <div className="flex items-center space-x-2">
                <Code className="w-5 h-5" />
                <span>Интерактивные демо</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Экспорт результатов</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="section-title text-4xl font-bold mb-4">
            Возможности платформы
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Современные инструменты для интерактивного демонстрирования возможностей ИИ в разработке 1С
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="group relative bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-300">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Scenarios Section */}
      <CustomScenarioSection />

      {/* Roles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="section-title text-4xl font-bold mb-4">
            Выберите роль ассистента
          </h2>
          <p className="text-xl text-slate-300">
            Каждая роль демонстрирует уникальные возможности ИИ-ассистента
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Object.entries(allRoleData).map(([key, role]) => {
            if (!role) return null;
            
            return (
              <div
                key={role.id}
                className="role-card group p-6 rounded-xl cursor-pointer"
                onClick={() => handleRoleClick(role.id)}
              >
                <div className="flex items-center mb-6">
                  <div className="text-5xl mr-4 group-hover:scale-110 transition-transform">
                    {role.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{role.name}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${
                      role.color === 'purple' ? 'bg-purple-900/30 border-purple-500/30 text-purple-300' :
                      role.color === 'green' ? 'bg-green-900/30 border-green-500/30 text-green-300' :
                      role.color === 'blue' ? 'bg-blue-900/30 border-blue-500/30 text-blue-300' :
                      role.color === 'pink' ? 'bg-pink-900/30 border-pink-500/30 text-pink-300' :
                      'bg-orange-900/30 border-orange-500/30 text-orange-300'
                    }`}>
                      {role.id}
                    </span>
                  </div>
                </div>
                
                <p className="text-slate-300 mb-6 leading-relaxed">{role.description}</p>
                
                <div className="space-y-3 mb-6">
                  <h4 className="text-sm font-semibold text-slate-200">Доступные сценарии:</h4>
                  {role.scenarios.slice(0, 2).map((scenario) => (
                    <div key={scenario.id} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                      <span className="text-sm text-slate-300">{scenario.title}</span>
                    </div>
                  ))}
                  {role.scenarios.length > 2 && (
                    <div className="text-sm text-slate-400">
                      и еще {role.scenarios.length - 2} сценариев...
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-slate-400">
                      {role.scenarios.length} сценариев
                    </span>
                  </div>
                  <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105">
                    <span>Начать демо</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-t border-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="section-title text-3xl font-bold mb-4">
              Готовы увидеть возможности ИИ-ассистентов?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Выберите роль и начните интерактивную демонстрацию прямо сейчас
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => handleRoleClick('developer')}
                className="btn-primary px-8 py-4 text-lg font-medium text-white rounded-xl flex items-center space-x-2"
              >
                <Code className="w-6 h-6" />
                <span>Начать с разработчика</span>
              </button>
              <button
                onClick={() => handleRoleClick('architect')}
                className="bg-slate-600 hover:bg-slate-500 text-white px-8 py-4 text-lg font-medium rounded-xl transition-colors flex items-center space-x-2"
              >
                <Brain className="w-6 h-6" />
                <span>Начать с архитектора</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              ИИ-ассистенты для 1С
            </h3>
            <p className="text-slate-400 mb-6">
              Интерактивная демонстрация возможностей искусственного интеллекта в разработке
            </p>
            <div className="flex items-center justify-center space-x-8">
              <span className="text-sm text-slate-500">
                © 2025 MiniMax Agent
              </span>
              <span className="text-sm text-slate-500">
                Демо версия
              </span>
              <span className="text-sm text-slate-500">
                Улучшенные результаты
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Плавающий элемент MiniMax */}
      <div id="minimax-floating-ball">
        <div className="minimax-ball-content">
          <div className="minimax-logo-wave"></div>
          <span className="minimax-ball-text">Created by MiniMax Agent</span>
        </div>
        <div className="minimax-close-icon">×</div>
      </div>
    </div>
  );
};

export default HomePageClassic;
