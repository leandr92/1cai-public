import React, { useState } from 'react';
import { Menu, X, Bot, Star } from 'lucide-react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Логотип */}
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ИИ-ассистенты для 1С</h1>
              <div className="flex items-center text-yellow-400 text-sm">
                <Star className="w-4 h-4 mr-1 fill-current" />
                <span>Демонстрация v5.0</span>
              </div>
            </div>
          </div>

          {/* Навигация для десктопа */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('agents')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Агенты
            </button>
            <button
              onClick={() => scrollToSection('demo')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Демо
            </button>
            <button
              onClick={() => scrollToSection('examples')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Примеры
            </button>
            <button
              onClick={() => scrollToSection('cases')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Кейсы
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection('test')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
            >
              Тест
            </button>
          </nav>

          {/* Мобильное меню */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Мобильное меню */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-800 rounded-lg mt-2 p-4 space-y-3">
            <button
              onClick={() => scrollToSection('agents')}
              className="block w-full text-left text-gray-300 hover:text-white py-2"
            >
              Агенты
            </button>
            <button
              onClick={() => scrollToSection('demo')}
              className="block w-full text-left text-gray-300 hover:text-white py-2"
            >
              Демо
            </button>
            <button
              onClick={() => scrollToSection('examples')}
              className="block w-full text-left text-gray-300 hover:text-white py-2"
            >
              Примеры
            </button>
            <button
              onClick={() => scrollToSection('cases')}
              className="block w-full text-left text-gray-300 hover:text-white py-2"
            >
              Кейсы
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="block w-full text-left text-gray-300 hover:text-white py-2"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection('test')}
              className="block w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-center"
            >
              Тест
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;