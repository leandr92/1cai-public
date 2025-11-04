import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import QuickActions from '../components/dashboard/QuickActions';
import RecentTasks from '../components/dashboard/RecentTasks';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BarChart3, Clock, CheckCircle, TrendingUp } from 'lucide-react';

interface Stats {
  total: number;
  running: number;
  completed: number;
  failed: number;
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    total: 0,
    running: 0,
    completed: 0,
    failed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('dashboard-stats')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'demos', filter: `created_by=eq.${user?.id}` },
        () => {
          loadStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  async function loadStats() {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('demos')
        .select('status')
        .eq('created_by', user.id);

      if (error) throw error;
      
      if (data) {
        const newStats: Stats = {
          total: data.length,
          running: data.filter(d => d.status === 'running').length,
          completed: data.filter(d => d.status === 'completed').length,
          failed: data.filter(d => d.status === 'failed').length
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Добро пожаловать, {profile?.full_name || user?.email?.split('@')[0]}!
              </h1>
              <p className="text-gray-600">
                Управляйте вашими задачами и отслеживайте прогресс в реальном времени
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Всего задач</p>
                    {loading ? (
                      <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">В процессе</p>
                    {loading ? (
                      <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">{stats.running}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Завершено</p>
                    {loading ? (
                      <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Успешность</p>
                    {loading ? (
                      <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.total > 0 
                          ? Math.round((stats.completed / stats.total) * 100) 
                          : 0}%
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <QuickActions />
            </div>

            {/* Recent Tasks */}
            <div>
              <RecentTasks />
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
