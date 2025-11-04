import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ListTodo, 
  FileCheck, 
  HelpCircle,
  Settings,
  Sparkles
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      description: 'Обзор и быстрые действия'
    },
    { 
      path: '/tasks', 
      label: 'Задачи', 
      icon: ListTodo,
      description: 'Все ваши задачи'
    },
    { 
      path: '/results', 
      label: 'Результаты', 
      icon: FileCheck,
      description: 'История и результаты'
    },
    { 
      path: '/help', 
      label: 'Помощь', 
      icon: HelpCircle,
      description: 'FAQ и поддержка'
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] hidden lg:block">
      <div className="p-4 space-y-2">
        {/* Quick Start Card */}
        <div className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Быстрый старт</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Опишите задачу и получите решение за 60 секунд
          </p>
          <Link
            to="/dashboard"
            className="block w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 text-center transition-colors"
          >
            Новая задача
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-start gap-3 px-4 py-3 rounded-lg transition-all
                ${isActive(item.path)
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                  : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                }
              `}
            >
              <item.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                isActive(item.path) ? 'text-indigo-600' : 'text-gray-400'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
              </div>
            </Link>
          ))}
        </nav>

        {/* Settings at bottom */}
        <div className="pt-4 mt-4 border-t border-gray-200">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-400" />
            <span>Настройки</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
