import React, { useState, useEffect } from 'react';
import { ArrowDown, Zap, Users, TrendingUp, Brain } from 'lucide-react';

const Hero: React.FC = () => {
  const [currentText, setCurrentText] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const heroTexts = [
    "Архитектор систем 1С",
    "Разработчик решений",
    "Консультант процессов",
    "Аналитик данных"
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentText((prev) => (prev + 1) % heroTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const scrollToDemo = () => {
    const element = document.getElementById('demo');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="pt-16 pb-20 relative overflow-hidden">
      {/* Фоновые эффекты */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center">
          {/* Главный заголовок */}
          <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                ИИ-ассистенты
              </span>
              <br />
              <span className="text-white">для 1С</span>
            </h1>
            
            <div className="h-20 flex items-center justify-center">
              <p className="text-2xl md:text-3xl text-purple-300 transition-all duration-500">
                {heroTexts[currentText]}
              </p>
            </div>
          </div>

          {/* Описание */}
          <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Интерактивная демонстрация возможностей ИИ-ассистентов для разработки и сопровождения решений на платформе 1С:Предприятие
            </p>
          </div>

          {/* Статистика */}
          <div className={`transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="text-2xl font-bold text-white">3</div>
                <div className="text-gray-300 text-sm">ИИ-агента</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white">9</div>
                <div className="text-gray-300 text-sm">Готовых сценариев</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white">98%</div>
                <div className="text-gray-300 text-sm">Точность</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-center mb-2">
                  <Brain className="w-8 h-8 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-gray-300 text-sm">Доступность</div>
              </div>
            </div>
          </div>

          {/* Кнопка действия */}
          <div className={`transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <button
              onClick={scrollToDemo}
              className="group bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <span className="flex items-center space-x-2">
                <span>Начать демонстрацию</span>
                <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
              </span>
            </button>
          </div>

          {/* Дополнительная информация */}
          <div className={`transform transition-all duration-1000 delay-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="mt-16 grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
                <h3 className="text-xl font-semibold text-white mb-3">🚀 Быстрый старт</h3>
                <p className="text-gray-300">Выберите агента и опишите задачу. ИИ-ассистент мгновенно приступит к работе.</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/30">
                <h3 className="text-xl font-semibold text-white mb-3">🎯 Точные решения</h3>
                <p className="text-gray-300">Каждый агент специализируется на определенных задачах 1С с высокой точностью.</p>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
                <h3 className="text-xl font-semibold text-white mb-3">📊 Готовые кейсы</h3>
                <p className="text-gray-300">Реальные примеры успешного внедрения с детальными результатами.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;