/**
 * AIAssistantPanel - React компонент для работы с AI-ассистентами
 * Предоставляет интерфейс чата и специализированные функции для каждой роли
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  User, 
  Bot, 
  FileText, 
  BarChart3, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Trash2,
  Download,
  Settings
} from 'lucide-react';

// Типы данных
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: SourceDocument[];
  confidence?: number;
  metadata?: {
    model?: string;
    tokens?: number;
    responseTime?: number;
    [key: string]: string | number | boolean | null | undefined;
  };
}

interface SourceDocument {
  page_content: string;
  metadata: {
    source?: string;
    page?: number;
    chunk_id?: string;
    [key: string]: string | number | boolean | null | undefined;
  };
}

interface AnalysisResult {
  success: boolean;
  data: string | Record<string, any> | Array<any>;
  timestamp: Date;
  error?: string;
}

interface ConversationContext {
  projectId?: string;
  userRole?: string;
  requirements?: string;
  architecture?: {
    components?: string[];
    dependencies?: string[];
    [key: string]: any;
  };
  currentTask?: string;
}

// Настройки для разных ассистентов
const ASSISTANT_CONFIGS = {
  architect: {
    name: 'Архитектор AI',
    icon: <BarChart3 className="w-5 h-5" />,
    color: 'bg-blue-500',
    description: 'Анализ требований и проектирование архитектуры'
  },
  developer: {
    name: 'Разработчик AI',
    icon: <FileText className="w-5 h-5" />,
    color: 'bg-green-500',
    description: 'Генерация кода и помощь в разработке'
  },
  tester: {
    name: 'Тестировщик AI',
    icon: <Shield className="w-5 h-5" />,
    color: 'bg-purple-500',
    description: 'Создание тестов и обеспечение качества'
  },
  pm: {
    name: 'Менеджер проектов AI',
    icon: <Clock className="w-5 h-5" />,
    color: 'bg-orange-500',
    description: 'Планирование и управление проектами'
  },
  analyst: {
    name: 'Бизнес-аналитик AI',
    icon: <User className="w-5 h-5" />,
    color: 'bg-teal-500',
    description: 'Анализ требований и процессов'
  }
};

const AIAssistantPanel: React.FC = () => {
  // Состояние компонента
  const [selectedAssistant, setSelectedAssistant] = useState<string>('architect');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [context, setContext] = useState<ConversationContext>({});
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showRequirementsForm, setShowRequirementsForm] = useState<boolean>(false);
  const [requirementsText, setRequirementsText] = useState<string>('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Автоматическая прокрутка к последнему сообщению
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Автоматическое изменение размера текстового поля
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputMessage]);

  // Отправка сообщения ассистенту
  const sendMessage = async (content: string, messageType: 'chat' | 'requirements' = 'chat') => {
    if (!content.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      let response;
      
      if (messageType === 'requirements' && selectedAssistant === 'architect') {
        // Специализированный анализ требований
        response = await fetch('/api/assistants/architect/analyze-requirements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requirements_text: content,
            context: context
          })
        });
      } else {
        // Обычный чат
        response = await fetch(`/api/assistants/chat/${selectedAssistant}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: content,
            context: context,
            conversation_id: `conv_${selectedAssistant}_${Date.now()}`
          })
        });
      }

      const result = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.content || result.data?.analysis_summary || 'Не удалось получить ответ',
        timestamp: new Date(),
        sources: result.sources || [],
        confidence: result.confidence || 0.8,
        metadata: result
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Если это анализ требований, сохраняем результат
      if (messageType === 'requirements') {
        setAnalysisResult({
          success: result.success,
          data: result.data,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Извините, произошла ошибка при обработке вашего запроса.',
        timestamp: new Date(),
        metadata: { error: error.message }
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  // Обработка отправки сообщения через Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  // Анализ требований для архитектора
  const analyzeRequirements = async () => {
    if (!requirementsText.trim()) return;
    
    await sendMessage(requirementsText, 'requirements');
    setRequirementsText('');
    setShowRequirementsForm(false);
  };

  // Комплексный анализ
  const runComprehensiveAnalysis = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/assistants/architect/comprehensive-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements_text: requirementsText || context.requirements || '',
          context: context
        })
      });

      const result = await response.json();
      
      const analysisMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Комплексный анализ завершен:\n\n${JSON.stringify(result.data.summary, null, 2)}`,
        timestamp: new Date(),
        metadata: result.data
      };

      setMessages(prev => [...prev, analysisMessage]);
      setAnalysisResult(result);

    } catch (error) {
      console.error('Ошибка при комплексном анализе:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Очистка истории диалога
  const clearConversation = async () => {
    try {
      await fetch(`/api/assistants/architect/conversation-history`, {
        method: 'DELETE'
      });
      setMessages([]);
      setAnalysisResult(null);
    } catch (error) {
      console.error('Ошибка при очистке истории:', error);
    }
  };

  // Экспорт диалога
  const exportConversation = () => {
    const conversationData = {
      assistant: selectedAssistant,
      messages: messages,
      context: context,
      timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(conversationData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversation_${selectedAssistant}_${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  // Формирование представления сообщения
  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === 'user';
    const config = isUser ? null : ASSISTANT_CONFIGS[selectedAssistant as keyof typeof ASSISTANT_CONFIGS];

    return (
      <div key={message.id || index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Аватар */}
          <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
              isUser ? 'bg-gray-600' : config?.color || 'bg-gray-500'
            }`}>
              {isUser ? <User className="w-4 h-4" /> : config?.icon}
            </div>
          </div>

          {/* Содержимое сообщения */}
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`rounded-lg px-4 py-2 ${
              isUser 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-900 border'
            }`}>
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {message.content}
              </pre>
            </div>

            {/* Метаданные */}
            <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
              {message.confidence && (
                <span className="inline-flex items-center mr-2">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {Math.round(message.confidence * 100)}%
                </span>
              )}
              <span>{message.timestamp.toLocaleTimeString()}</span>
            </div>

            {/* Источники */}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-2 text-xs">
                <div className="text-gray-600 mb-1">Источники:</div>
                {message.sources.map((source, idx) => (
                  <div key={idx} className="bg-gray-50 p-2 rounded text-gray-700 text-xs mb-1">
                    {source.page_content.substring(0, 100)}...
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const currentConfig = ASSISTANT_CONFIGS[selectedAssistant as keyof typeof ASSISTANT_CONFIGS];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Заголовок */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${currentConfig.color}`}>
            {currentConfig.icon}
          </div>
          <div className="ml-3">
            <h3 className="font-semibold text-gray-900">{currentConfig.name}</h3>
            <p className="text-sm text-gray-600">{currentConfig.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Переключатель ассистентов */}
          <select
            value={selectedAssistant}
            onChange={(e) => setSelectedAssistant(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            {Object.entries(ASSISTANT_CONFIGS).map(([key, config]) => (
              <option key={key} value={key}>{config.name}</option>
            ))}
          </select>
          
          {/* Действия */}
          <button
            onClick={exportConversation}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            title="Экспортировать диалог"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={clearConversation}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
            title="Очистить диалог"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Специализированные действия для архитектора */}
      {selectedAssistant === 'architect' && (
        <div className="p-4 border-b bg-blue-50">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowRequirementsForm(!showRequirementsForm)}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex items-center"
            >
              <FileText className="w-4 h-4 mr-1" />
              Анализ требований
            </button>
            
            <button
              onClick={runComprehensiveAnalysis}
              disabled={isLoading || !requirementsText}
              className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50 flex items-center"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Комплексный анализ
            </button>
          </div>
          
          {showRequirementsForm && (
            <div className="mt-3">
              <textarea
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                placeholder="Введите бизнес-требования для анализа..."
                className="w-full p-2 border rounded text-sm"
                rows={4}
              />
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={analyzeRequirements}
                  disabled={!requirementsText.trim()}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  Анализировать
                </button>
                <button
                  onClick={() => setShowRequirementsForm(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Область сообщений */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '400px' }}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Начните диалог с {currentConfig.name}</p>
            <p className="text-sm mt-2">
              {selectedAssistant === 'architect' && 'Вы можете проанализировать требования или получить архитектурные рекомендации'}
              {selectedAssistant === 'developer' && 'Получите помощь с кодом и решением технических задач'}
              {selectedAssistant === 'tester' && 'Создайте тестовые сценарии и проверьте качество'}
              {selectedAssistant === 'pm' && 'Планируйте проекты и отслеживайте прогресс'}
              {selectedAssistant === 'analyst' && 'Анализируйте бизнес-процессы и требования'}
            </p>
          </div>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
        
        {/* Индикатор печати */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm">Печатает...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Результаты анализа */}
      {analysisResult && (
        <div className="p-4 border-t bg-green-50">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="font-semibold text-green-800">Анализ завершен</span>
          </div>
          <div className="text-sm text-green-700">
            {analysisResult.data?.analysis_summary && (
              <div>
                <div>Всего требований: {analysisResult.data.analysis_summary.total_count}</div>
                <div>Высокий приоритет: {analysisResult.data.analysis_summary.high_priority_count}</div>
                <div>Средняя сложность: {Math.round(analysisResult.data.analysis_summary.average_complexity)}/10</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Поле ввода */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Задайте вопрос ${currentConfig.name}...`}
            className="flex-1 p-2 border rounded resize-none text-sm"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
            disabled={isTyping}
          />
          <button
            onClick={() => sendMessage(inputMessage)}
            disabled={!inputMessage.trim() || isTyping}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPanel;