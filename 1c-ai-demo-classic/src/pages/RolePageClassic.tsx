import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Clock, Target, ChevronDown } from 'lucide-react';
import { getRoleData } from '../data/demoContent';
import EnhancedDemoController from '../components/EnhancedDemoController';

const RolePageClassic: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const roleData = getRoleData(id || '');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');

  if (!roleData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Роль не найдена</h2>
          <Link to="/" className="text-blue-400 hover:text-blue-300">
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  const currentScenario = selectedScenarioId 
    ? roleData.scenarios.find(s => s.id === selectedScenarioId) || roleData.scenarios[0]
    : roleData.scenarios[0];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Простой': return 'bg-green-900/30 border-green-500/30 text-green-300';
      case 'Средний': return 'bg-yellow-900/30 border-yellow-500/30 text-yellow-300';
      case 'Сложный': return 'bg-red-900/30 border-red-500/30 text-red-300';
      default: return 'bg-slate-900/30 border-slate-500/30 text-slate-300';
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'purple': return {
        accent: 'from-purple-500 to-purple-600',
        border: 'border-purple-500/30',
        bg: 'bg-purple-900/20'
      };
      case 'green': return {
        accent: 'from-green-500 to-green-600',
        border: 'border-green-500/30',
        bg: 'bg-green-900/20'
      };
      case 'blue': return {
        accent: 'from-blue-500 to-blue-600',
        border: 'border-blue-500/30',
        bg: 'bg-blue-900/20'
      };
      case 'pink': return {
        accent: 'from-pink-500 to-pink-600',
        border: 'border-pink-500/30',
        bg: 'bg-pink-900/20'
      };
      case 'orange': return {
        accent: 'from-orange-500 to-orange-600',
        border: 'border-orange-500/30',
        bg: 'bg-orange-900/20'
      };
      default: return {
        accent: 'from-slate-500 to-slate-600',
        border: 'border-slate-500/30',
        bg: 'bg-slate-900/20'
      };
    }
  };

  const colors = getColorClasses(roleData.color);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Заголовок */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>На главную</span>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="text-6xl">{roleData.icon}</div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  {roleData.name} 1С
                </h1>
                <p className="text-slate-300 text-lg">
                  {roleData.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Боковая панель */}
          <div className="lg:col-span-1">
            <div className="demo-container p-6 sticky top-6">
              
              {/* Описание роли */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <User className="w-5 h-5 text-slate-400" />
                  <h3 className="text-lg font-semibold text-white">Роль ассистента</h3>
                </div>
                <span className={`inline-block px-3 py-2 rounded-lg text-sm font-medium border ${colors.border} ${colors.bg} text-white mb-4`}>
                  {roleData.name}
                </span>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {roleData.description}
                </p>
              </div>

              {/* Выбор сценария */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">
                  Доступные сценарии
                </h4>
                <div className="space-y-3">
                  {roleData.scenarios.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => setSelectedScenarioId(scenario.id)}
                      className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                        currentScenario.id === scenario.id
                          ? `${colors.border} ${colors.bg} text-white`
                          : 'border-slate-600 hover:border-slate-500 text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <h5 className="font-medium text-sm mb-2">{scenario.title}</h5>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {scenario.difficulty} • {scenario.estimatedTime}
                        </span>
                        <span className="text-xs bg-slate-700 px-2 py-1 rounded">
                          {scenario.results.length} файлов
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Информация о сценарии */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h4 className="font-semibold text-white mb-3">Текущий сценарий</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Сложность:</span>
                    <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(currentScenario.difficulty)}`}>
                      {currentScenario.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Время:</span>
                    <span className="text-white">{currentScenario.estimatedTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Файлов:</span>
                    <span className="text-white">{currentScenario.results.length}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-600">
                  <p className="text-xs text-slate-400 mb-2">Ожидаемые результаты:</p>
                  <div className="space-y-1">
                    {currentScenario.results.slice(0, 3).map((result, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        <span className="text-slate-300 truncate">{result.title}</span>
                      </div>
                    ))}
                    {currentScenario.results.length > 3 && (
                      <div className="text-xs text-slate-500">
                        и еще {currentScenario.results.length - 3} файлов...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Основной контент */}
          <div className="lg:col-span-3">
            {/* Информация о сценарии */}
            <div className="demo-container p-6 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-3">
                    {currentScenario.title}
                  </h2>
                  <p className="text-slate-300 text-lg leading-relaxed">
                    {currentScenario.description}
                  </p>
                </div>
                <div className="ml-6 text-right">
                  <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium border ${getDifficultyColor(currentScenario.difficulty)} mb-2`}>
                    {currentScenario.difficulty}
                  </span>
                  <div className="flex items-center space-x-2 text-slate-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{currentScenario.estimatedTime}</span>
                  </div>
                </div>
              </div>

              {/* Детали сценария */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h4 className="font-semibold text-white mb-3">Возможности</h4>
                  <div className="space-y-2">
                    {currentScenario.results.slice(0, 4).map((result, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-slate-300">{result.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h4 className="font-semibold text-white mb-3">Ожидаемые файлы</h4>
                  <div className="space-y-2">
                    {currentScenario.results.map((result, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-sm text-slate-300">{result.filename}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Демонстрация */}
            <EnhancedDemoController 
              roleId={roleData.id} 
              scenarioId={currentScenario.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolePageClassic;
