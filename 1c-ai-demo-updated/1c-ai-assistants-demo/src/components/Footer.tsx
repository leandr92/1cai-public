import React from 'react';
import { 
  Bot, 
  Mail, 
  Phone, 
  MapPin, 
  Github, 
  Linkedin, 
  Twitter,
  Heart,
  ExternalLink,
  Clock,
  Shield,
  Zap
} from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: <Github className="w-5 h-5" />, href: '#', label: 'GitHub' },
    { icon: <Linkedin className="w-5 h-5" />, href: '#', label: 'LinkedIn' },
    { icon: <Twitter className="w-5 h-5" />, href: '#', label: 'Twitter' }
  ];

  const quickLinks = [
    { label: 'Агенты', href: '#agents' },
    { label: 'Демонстрация', href: '#demo' },
    { label: 'Примеры', href: '#examples' },
    { label: 'Кейсы', href: '#cases' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Тест', href: '#test' }
  ];

  const features = [
    { icon: <Zap className="w-4 h-4" />, text: 'Быстрая обработка' },
    { icon: <Shield className="w-4 h-4" />, text: 'Безопасность данных' },
    { icon: <Clock className="w-4 h-4" />, text: '24/7 поддержка' }
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId.replace('#', ''));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-slate-900 border-t border-white/10 relative overflow-hidden">
      {/* Фоновые эффекты */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        {/* Основное содержимое футера */}
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Логотип и описание */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">ИИ-ассистенты для 1С</h3>
                <p className="text-purple-300 text-sm">Демонстрация v5.0</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              Интерактивная демонстрация возможностей ИИ-ассистентов для разработки и сопровождения 
              решений на платформе 1С:Предприятие. Автоматизация сложных задач с помощью искусственного интеллекта.
            </p>

            {/* Особенности */}
            <div className="flex flex-wrap gap-4 mb-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-gray-400">
                  <div className="text-purple-400">
                    {feature.icon}
                  </div>
                  <span className="text-sm">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Социальные сети */}
            <div className="flex space-x-4">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  aria-label={link.label}
                  className="bg-white/10 p-3 rounded-lg text-gray-400 hover:text-white hover:bg-purple-500/20 transition-all duration-300"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Быстрые ссылки */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">Навигация</h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-gray-400 hover:text-white transition-colors duration-300 text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">Контакты</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-gray-400">
                <Mail className="w-5 h-5 text-purple-400" />
                <a 
                  href="mailto:demo@ai-assistants.ru" 
                  className="hover:text-white transition-colors"
                >
                  demo@ai-assistants.ru
                </a>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <Phone className="w-5 h-5 text-purple-400" />
                <a 
                  href="tel:+7-800-123-4567" 
                  className="hover:text-white transition-colors"
                >
                  +7 (800) 123-45-67
                </a>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <MapPin className="w-5 h-5 text-purple-400" />
                <span>Москва, Россия</span>
              </div>
            </div>

            {/* Кнопка перехода на сайт */}
            <div className="mt-6">
              <a
                href="https://buqz9mg9viy3.space.minimax.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Перейти на сайт</span>
              </a>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-white mb-1">3</div>
            <div className="text-gray-400 text-sm">ИИ-агента</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-white mb-1">15K+</div>
            <div className="text-gray-400 text-sm">Задач выполнено</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-white mb-1">98%</div>
            <div className="text-gray-400 text-sm">Точность</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-white mb-1">24/7</div>
            <div className="text-gray-400 text-sm">Доступность</div>
          </div>
        </div>

        {/* Нижняя часть */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © {currentYear} ИИ-ассистенты для 1С. Все права защищены.
            </div>
            
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <span>Сделано с</span>
              <Heart className="w-4 h-4 text-red-400 fill-current" />
              <span>для сообщества 1С</span>
            </div>
            
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Политика конфиденциальности
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Условия использования
              </a>
            </div>
          </div>
        </div>

        {/* Версия и техническая информация */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-4 text-xs text-gray-500">
            <span>Версия: 5.0.0</span>
            <span>•</span>
            <span>Последнее обновление: Ноябрь 2025</span>
            <span>•</span>
            <span>React + TypeScript</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;