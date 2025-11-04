import React from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, Clock, Zap } from 'lucide-react';
import { SUCCESS_CASES } from '../../data/contentData';

export default function SuccessCasesSection() {
  const getComplexityColor = (complexity: string) => {
    const colors = {
      'Низкая': 'bg-green-100 text-green-800',
      'Средняя': 'bg-yellow-100 text-yellow-800',
      'Высокая': 'bg-red-100 text-red-800'
    };
    return colors[complexity as keyof typeof colors] || colors['Средняя'];
  };

  return (
    <section className="py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Реальные успешные кейсы
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Наши пользователи экономят до 90% времени на разработке. Вот несколько примеров.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {SUCCESS_CASES.map((caseItem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              {/* Header with saved time */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
                <div className="flex items-center justify-between mb-3">
                  <Zap className="w-8 h-8" />
                  <div className="text-right">
                    <div className="text-3xl font-bold">{caseItem.timeSaved}</div>
                    <div className="text-sm text-green-100">экономии времени</div>
                  </div>
                </div>
                <h3 className="font-bold text-xl mb-1">{caseItem.title}</h3>
                <p className="text-green-100 text-sm">{caseItem.company}</p>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase">Задача</span>
                  </div>
                  <p className="text-sm text-gray-700">{caseItem.task}</p>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase">Результат</span>
                  </div>
                  <p className="text-sm text-gray-700">{caseItem.result}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-xs text-gray-500">Сложность:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getComplexityColor(caseItem.complexity)}`}>
                    {caseItem.complexity}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-lg text-gray-700 mb-4">
            Присоединяйтесь к тысячам разработчиков, которые ускоряют свою работу с помощью ИИ-агентов
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Без кредитной карты
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Реальные ИИ-агенты
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Начните за 1 минуту
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
