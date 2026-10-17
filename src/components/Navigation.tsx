import React from 'react';
import { Plus, Sparkles, Clock, CheckSquare, Calendar, BookOpen, LayoutDashboard } from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenNewTask: () => void;
  todayCompletedCount: number;
  totalTasksToday: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  onOpenNewTask,
  todayCompletedCount,
  totalTasksToday,
}) => {
  const tabs = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'tasks', label: '할 일 보드', icon: CheckSquare },
    { id: 'habits', label: '습관 트래커', icon: Calendar },
    { id: 'notes', label: '스마트 노트', icon: BookOpen },
    { id: 'focus', label: '포커스 룸', icon: Clock },
    { id: 'ai', label: 'AI 코파일럿', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0c0e14]/90 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white font-bold text-base shadow-sm">
              F
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
                FlowSpace
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-3 text-sm font-medium">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-neutral-800/90 text-white font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-neutral-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action & Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center text-xs text-neutral-400 tabular-nums pr-2 border-r border-neutral-800">
            <span>오늘 할 일</span>
            <span className="mx-1.5 text-neutral-600">·</span>
            <span className="font-semibold text-neutral-200">
              {todayCompletedCount}/{totalTasksToday} 완료
            </span>
          </div>

          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>새 작업</span>
          </button>

          <div className="w-8 h-8 rounded-full overflow-hidden border border-neutral-700/80 shrink-0">
            <img
              src="/src/assets/images/workspace_avatar_1792229301280.jpg"
              alt="사용자 프로필"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Navigation bar */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto pt-3 pb-1 border-t border-neutral-800/50 mt-2.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white bg-neutral-900/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
