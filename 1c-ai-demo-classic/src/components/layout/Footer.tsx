import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 mb-3">AI Ecosystem 1С</h3>
            <p className="text-sm text-gray-600 mb-4">
              Искусственный интеллект для автоматизации разработки в 1С. 
              Создавайте документы, отчеты и решения за минуты, а не часы.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="mailto:support@example.com"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Навигация</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  Главная
                </Link>
              </li>
              <li>
                <Link to="/demo" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  Демо
                </Link>
              </li>
              <li>
                <Link to="/cases" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  Кейсы
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  Помощь
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Поддержка</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/docs" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  Документация
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  Контакты
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  Конфиденциальность
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6">
          <p className="text-center text-sm text-gray-500">
            {currentYear} AI Ecosystem 1С. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}
