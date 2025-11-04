import React, { useState } from 'react';
import { TestTube, Copy, ExternalLink, Eye, EyeOff, CheckCircle, User, Lock } from 'lucide-react';

const TestAccount: React.FC = () => {
  const [showCredentials, setShowCredentials] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const testCredentials = {
    email: 'efbmshca@minimax.com',
    password: '69iQb5zZnz',
    userId: '63522c90-a473-40ad-aa2f-3b4341724d8d'
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const openWebsite = () => {
    window.open('https://buqz9mg9viy3.space.minimax.io', '_blank');
  };

  return (
    <section id="test" className="py-20 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок секции */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Тестовый <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">аккаунт</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Протестируйте все возможности наших ИИ-ассистентов с готовым демо-аккаунтом
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Левая колонка - Информация */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-cyan-500">
                <TestTube className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Демо-аккаунт</h3>
            </div>

            <p className="text-gray-300 mb-6 leading-relaxed">
              Используйте готовый аккаунт для полного тестирования всех функций системы. 
              В аккаунте уже созданы демонстрационные задачи и настроены все компоненты.
            </p>

            {/* Возможности */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Полный доступ ко всем ИИ-агентам</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Готовые демонстрационные задачи</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Интерактивные примеры</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Реальная работа с базой данных</span>
              </div>
            </div>

            {/* Инструкция */}
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-500/30">
              <h4 className="font-semibold text-white mb-2">Как использовать:</h4>
              <ol className="text-sm text-gray-300 space-y-1">
                <li>1. Откройте сайт по кнопке ниже</li>
                <li>2. Войдите используя данные аккаунта</li>
                <li>3. Выберите агента и опишите задачу</li>
                <li>4. Получите результат в реальном времени</li>
              </ol>
            </div>
          </div>

          {/* Правая колонка - Учетные данные */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Учетные данные</h3>
              <button
                onClick={() => setShowCredentials(!showCredentials)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                {showCredentials ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="text-sm">{showCredentials ? 'Скрыть' : 'Показать'}</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Email</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white font-mono">
                    {showCredentials ? testCredentials.email : '••••••••@minimax.com'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(testCredentials.email, 'email')}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                  >
                    {copied === 'email' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Пароль */}
              <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                <div className="flex items-center space-x-2 mb-2">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Пароль</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white font-mono">
                    {showCredentials ? testCredentials.password : '•••••••••••'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(testCredentials.password, 'password')}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                  >
                    {copied === 'password' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* User ID */}
              <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                <div className="flex items-center space-x-2 mb-2">
                  <TestTube className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">User ID</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-mono text-sm">
                    {showCredentials ? testCredentials.userId : '••••••••-••••-••••-••••-••••••••••••'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(testCredentials.userId, 'userId')}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                  >
                    {copied === 'userId' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="mt-6 space-y-3">
              <button
                onClick={openWebsite}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Открыть сайт</span>
              </button>
              
              <button
                onClick={() => copyToClipboard(`Email: ${testCredentials.email}\nПароль: ${testCredentials.password}`, 'all')}
                className="w-full border border-white/20 text-gray-300 py-3 px-6 rounded-lg font-semibold hover:border-white/40 hover:text-white transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Copy className="w-5 h-5" />
                <span>Скопировать все данные</span>
              </button>
            </div>

            {/* Статус */}
            <div className="mt-6 flex items-center justify-center space-x-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Аккаунт активен и готов к использованию</span>
            </div>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-12 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border border-yellow-500/30">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <TestTube className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">Важная информация</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Данный аккаунт предназначен только для демонстрации возможностей</li>
                <li>• Все данные в аккаунте являются тестовыми и будут регулярно очищаться</li>
                <li>• Для production использования необходима регистрация реального аккаунта</li>
                <li>• При возникновении вопросов обращайтесь в техническую поддержку</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestAccount;