import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Clock, Award, Target, Zap } from 'lucide-react';

interface Stat {
  label: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const Statistics: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValues, setAnimatedValues] = useState<number[]>([]);

  const stats: Stat[] = [
    {
      label: 'Выполнено задач',
      value: 15847,
      unit: '',
      icon: <Target className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-500',
      description: 'Успешно завершенных проектов'
    },
    {
      label: 'Довольных клиентов',
      value: 98,
      unit: '%',
      icon: <Users className="w-8 h-8" />,
      color: 'from-green-500 to-emerald-500',
      description: 'Положительных отзывов'
    },
    {
      label: 'Экономия времени',
      value: 60,
      unit: '%',
      icon: <Clock className="w-8 h-8" />,
      color: 'from-purple-500 to-pink-500',
      description: 'Сокращение времени разработки'
    },
    {
      label: 'Средняя оценка',
      value: 4.9,
      unit: '/5',
      icon: <Award className="w-8 h-8" />,
      color: 'from-yellow-500 to-orange-500',
      description: 'Рейтинг качества решений'
    },
    {
      label: 'Скорость выполнения',
      value: 5,
      unit: 'x',
      icon: <Zap className="w-8 h-8" />,
      color: 'from-red-500 to-pink-500',
      description: 'Быстрее традиционных методов'
    },
    {
      label: 'Рост эффективности',
      value: 250,
      unit: '%',
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'from-indigo-500 to-purple-500',
      description: 'Повышение производительности'
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const element = document.getElementById('statistics');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      // Анимированное увеличение значений
      const durations = [2000, 2500, 3000, 3500, 4000, 4500];
      
      stats.forEach((stat, index) => {
        const duration = durations[index];
        const steps = 60;
        const stepDuration = duration / steps;
        const increment = stat.value / steps;

        let currentValue = 0;
        const timer = setInterval(() => {
          currentValue += increment;
          if (currentValue >= stat.value) {
            currentValue = stat.value;
            clearInterval(timer);
          }
          
          setAnimatedValues(prev => {
            const newValues = [...prev];
            newValues[index] = Math.floor(currentValue * 10) / 10;
            return newValues;
          });
        }, stepDuration);
      });
    }
  }, [isVisible]);

  const formatValue = (value: number, stat: Stat) => {
    if (stat.unit === '%') {
      return `${Math.floor(value)}%`;
    } else if (stat.unit === '/5') {
      return `${value.toFixed(1)}/5`;
    } else if (stat.unit === 'x') {
      return `${value.toFixed(1)}x`;
    } else if (stat.label === 'Средняя оценка') {
      return value.toFixed(1);
    }
    return Math.floor(value).toLocaleString('ru-RU');
  };

  return (
    <section id="statistics" className="py-20 relative overflow-hidden">
      {/* Фоновые эффекты */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Заголовок секции */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Статистика <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">использования</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Реальные показатели эффективности наших ИИ-ассистентов в рабочих проектах
          </p>
        </div>

        {/* Сетка статистики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-purple-500/50 transition-all duration-500 hover:transform hover:scale-105"
            >
              {/* Иконка */}
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${stat.color} mb-6`}>
                <div className="text-white">
                  {stat.icon}
                </div>
              </div>

              {/* Значение */}
              <div className="mb-4">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {animatedValues[index] !== undefined ? formatValue(animatedValues[index], stat) : '0'}
                  </span>
                </div>
                <div className="text-gray-300 text-lg">{stat.label}</div>
              </div>

              {/* Описание */}
              <div className="text-gray-400 text-sm leading-relaxed">
                {stat.description}
              </div>

              {/* Прогресс-бар */}
              <div className="mt-6 w-full bg-white/10 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full bg-gradient-to-r ${stat.color} transition-all duration-1000 ease-out`}
                  style={{ 
                    width: isVisible ? `${Math.min((animatedValues[index] / stat.value) * 100, 100)}%` : '0%' 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Дополнительная информация */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">24/7</div>
            <div className="text-gray-300">Непрерывная работа</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">50+</div>
            <div className="text-gray-300">Готовых решений</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">200+</div>
            <div className="text-gray-300">Часов экономии в месяц</div>
          </div>
        </div>

        {/* Временная линия достижений */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-white text-center mb-8">Ключевые достижения</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/30">
              <div className="text-2xl font-bold text-blue-300 mb-2">2023</div>
              <div className="text-white font-semibold mb-1">Запуск проекта</div>
              <div className="text-gray-300 text-sm">Первые 100 пользователей</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
              <div className="text-2xl font-bold text-green-300 mb-2">1K+</div>
              <div className="text-white font-semibold mb-1">Активных пользователей</div>
              <div className="text-gray-300 text-sm">Расширение команды</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
              <div className="text-2xl font-bold text-purple-300 mb-2">98%</div>
              <div className="text-white font-semibold mb-1">Удовлетворенность</div>
              <div className="text-gray-300 text-sm">Качество решений</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-500/30">
              <div className="text-2xl font-bold text-yellow-300 mb-2">15K+</div>
              <div className="text-white font-semibold mb-1">Выполнено задач</div>
              <div className="text-gray-300 text-sm">Стабильный рост</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Statistics;