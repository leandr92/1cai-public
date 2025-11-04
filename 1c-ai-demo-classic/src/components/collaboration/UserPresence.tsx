// User Presence Component - отображение присутствия пользователей в сессии
import React, { useMemo } from 'react';
import { Users, Crown, User, Clock } from 'lucide-react';
import { User as UserType } from '../../services/websocket-service';

interface UserPresenceProps {
  participants: UserType[];
  currentUserId: string | null;
  className?: string;
  showActivity?: boolean;
  maxDisplayUsers?: number;
}

const UserPresence: React.FC<UserPresenceProps> = ({
  participants,
  currentUserId,
  className = '',
  showActivity = true,
  maxDisplayUsers = 6
}) => {
  // Сортируем пользователей: хост сначала, затем активные, затем неактивные
  const sortedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => {
      // Хост всегда первый
      const aIsHost = (a.permissions || []).includes('admin');
      const bIsHost = (b.permissions || []).includes('admin');
      if (aIsHost && !bIsHost) return -1;
      if (!aIsHost && bIsHost) return 1;
      
      // Активные пользователи выше неактивных
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      
      // По времени последней активности
      return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
    });
  }, [participants]);

  const displayedParticipants = sortedParticipants.slice(0, maxDisplayUsers);
  const hiddenCount = Math.max(0, participants.length - maxDisplayUsers);

  const getActivityStatus = (user: UserType) => {
    if (!user.isActive) return { text: 'Неактивен', color: 'text-slate-400' };
    
    const lastSeenMinutes = Math.floor((Date.now() - new Date(user.lastSeen).getTime()) / 60000);
    
    if (lastSeenMinutes < 1) return { text: 'Активен', color: 'text-green-400' };
    if (lastSeenMinutes < 5) return { text: `Активен ${lastSeenMinutes}м назад`, color: 'text-yellow-400' };
    return { text: `Активен ${lastSeenMinutes}м назад`, color: 'text-orange-400' };
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (participants.length === 0) {
    return (
      <div className={`flex items-center space-x-2 text-slate-400 ${className}`}>
        <Users className="w-4 h-4" />
        <span className="text-sm">Никто не присоединился</span>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/50 rounded-lg p-4 ${className}`}>
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-slate-200">
            Участники ({participants.length})
          </span>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>{participants.filter(p => p.isActive).length} онлайн</span>
        </div>
      </div>

      {/* Список участников */}
      <div className="space-y-2">
        {displayedParticipants.map((participant) => {
          const activity = getActivityStatus(participant);
          const isCurrentUser = participant.userId === currentUserId;
          const isHost = (participant.permissions || []).includes('admin');
          
          return (
            <div
              key={participant.userId}
              className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                isCurrentUser 
                  ? 'bg-blue-900/30 border border-blue-500/30' 
                  : 'bg-slate-700/30 hover:bg-slate-700/50'
              }`}
            >
              {/* Аватар */}
              <div className="relative">
                {participant.avatar ? (
                  <img
                    src={participant.avatar}
                    alt={participant.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                    {getUserInitials(participant.name)}
                  </div>
                )}
                
                {/* Статус активности */}
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-800 ${
                  participant.isActive ? 'bg-green-400' : 'bg-slate-400'
                }`} />
              </div>

              {/* Информация о пользователе */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium truncate ${
                    isCurrentUser ? 'text-blue-300' : 'text-slate-200'
                  }`}>
                    {participant.name}
                    {isCurrentUser && ' (Вы)'}
                  </span>
                  
                  {isHost && (
                    <Crown className="w-3 h-3 text-yellow-400" title="Хост" />
                  )}
                </div>
                
                {showActivity && (
                  <div className={`text-xs ${activity.color} mt-0.5`}>
                    <Clock className="w-3 h-3 inline mr-1" />
                    {activity.text}
                  </div>
                )}
              </div>

              {/* Роль и права */}
              <div className="flex items-center space-x-1">
                {participant.role && (
                  <span className="px-2 py-1 text-xs rounded-full bg-slate-600/50 text-slate-300">
                    {participant.role}
                  </span>
                )}
                
                {(participant.permissions || []).includes('edit') && !isHost && (
                  <User className="w-3 h-3 text-blue-400" title="Может редактировать" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Скрытые пользователи */}
      {hiddenCount > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-600">
          <button className="text-xs text-slate-400 hover:text-slate-300 transition-colors">
            +{hiddenCount} еще участников
          </button>
        </div>
      )}

      {/* Быстрые действия */}
      <div className="mt-3 pt-3 border-t border-slate-600">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Сессия активна</span>
          <button className="hover:text-slate-300 transition-colors">
            Пригласить
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPresence;
