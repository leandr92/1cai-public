import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { FAQ_DATA } from '../../data/contentData';

export default function FAQSection() {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const toggleQuestion = (questionId: string) => {
    setOpenQuestion(openQuestion === questionId ? null : questionId);
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <HelpCircle className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Часто задаваемые вопросы
          </h2>
          <p className="text-xl text-gray-600">
            Ответы на популярные вопросы о работе с ИИ-агентами
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {FAQ_DATA.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-indigo-600 rounded-full"></span>
                {category.category}
              </h3>
              
              <div className="space-y-4">
                {category.questions.map((item, questionIndex) => {
                  const questionId = `${categoryIndex}-${questionIndex}`;
                  const isOpen = openQuestion === questionId;

                  return (
                    <motion.div
                      key={questionId}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: questionIndex * 0.05 }}
                      className="bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-indigo-300 transition-all"
                    >
                      <button
                        onClick={() => toggleQuestion(questionId)}
                        className="w-full p-6 flex items-center justify-between text-left"
                      >
                        <span className="font-semibold text-gray-900 pr-4">{item.q}</span>
                        <div className="flex-shrink-0">
                          {isOpen ? (
                            <ChevronUp className="w-6 h-6 text-indigo-600" />
                          ) : (
                            <ChevronDown className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 pt-0">
                              <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-600">
                                <p className="text-gray-700 leading-relaxed">{item.a}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
