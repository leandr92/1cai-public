import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, Target, Zap } from 'lucide-react';

const ArchitectPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">🏗️ Архитектор 1С</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          ИИ-архитектор для проектирования и анализа архитектуры 1С решений
        </p>
        <Badge variant="secondary" className="text-sm">✅ Завершено - 1,847 строк кода</Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="components">Компоненты</TabsTrigger>
          <TabsTrigger value="features">Возможности</TabsTrigger>
          <TabsTrigger value="integration">Интеграция</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Основные функции
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Архитектурный анализ решений</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Рекомендации по дизайн-паттернам</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Схема взаимодействия компонентов</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Оптимизация производительности</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Преимущества
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Автоматический анализ архитектуры</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Визуализация диаграмм</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Рефакторинг с AI подсказками</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Соблюдение Best Practices</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Созданные компоненты</CardTitle>
              <CardDescription>
                Полный перечень компонентов архитектора
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">📋 Обзор архитектуры</span>
                  <Badge variant="outline">1,237 строк</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">🔧 Конструктор архитектуры</span>
                  <Badge variant="outline">610 строк</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Функциональность</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">🎯 Архитектурный анализ</h4>
                  <p className="text-sm text-muted-foreground">
                    Автоматический анализ структуры 1С решений с выявлением архитектурных проблем
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">🎨 Визуализация</h4>
                  <p className="text-sm text-muted-foreground">
                    Mermaid диаграммы для наглядного представления архитектуры
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">⚡ Оптимизация</h4>
                  <p className="text-sm text-muted-foreground">
                    Рекомендации по улучшению производительности и структуры кода
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">📚 Best Practices</h4>
                  <p className="text-sm text-muted-foreground">
                    Соблюдение стандартов разработки 1С и современных практик
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Интеграция с системой</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <h4 className="text-lg font-semibold mb-4">Архитектор полностью интегрирован</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm">Сервисы созданы</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm">UI компоненты готовы</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm">Навигация настроена</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="text-center">
        <Button asChild>
          <a href="/role/architect">Перейти к архитектору</a>
        </Button>
      </div>
    </div>
  );
};

export default ArchitectPage;