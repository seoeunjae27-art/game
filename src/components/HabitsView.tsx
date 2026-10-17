import React, { useState } from 'react';
import { Habit, TaskCategory } from '../types';
import { 
  Plus, 
  Flame, 
  Check, 
  Trash2, 
  Sparkles, 
  Target, 
  Loader2 
} from 'lucide-react';

interface HabitsViewProps {
  habits: Habit[];
  onToggleHabitDay: (habitId: string, dateStr: string) => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'streak' | 'history'>) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  onToggleHabitDay,
  onAddHabit,
  onDeleteHabit,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('health');
  const [targetDays, setTargetDays] = useState(7);

  // AI Habit Coach state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiGoalInput, setAiGoalInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  // Generate recent 7 days (YYYY-MM-DD) based on 2026-10-17
  const recentDays = [
    { date: '2026-10-11', label: '일', dayNum: '11' },
    { date: '2026-10-12', label: '월', dayNum: '12' },
    { date: '2026-10-13', label: '화', dayNum: '13' },
    { date: '2026-10-14', label: '수', dayNum: '14' },
    { date: '2026-10-15', label: '목', dayNum: '15' },
    { date: '2026-10-16', label: '금', dayNum: '16' },
    { date: '2026-10-17', label: '오늘', dayNum: '17' },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddHabit({
      title: newTitle.trim(),
      category: newCategory,
      targetDaysPerWeek: targetDays,
    });
    setNewTitle('');
    setShowAddModal(false);
  };

  const handleAskAiCoach = async () => {
    if (!aiGoalInput.trim()) return;
    setAiLoading(true);
    setAiSuggestions('');
    try {
      const res = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recommend_routines',
          text: aiGoalInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.result) {
        setAiSuggestions(data.result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const categoryKorean: Record<TaskCategory, string> = {
    work: '업무',
    study: '학습',
    personal: '개인',
    health: '건강',
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/70 border border-neutral-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            데일리 습관 & 루틴 매트릭스
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            체크박스를 클릭하여 지난 7일간의 실천 기록을 업데이트하세요.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg border border-neutral-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI 루틴 추천</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>새 습관 추가</span>
          </button>
        </div>
      </div>

      {/* Habits Matrix Table */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/50 text-xs text-neutral-400 font-medium">
                <th className="py-3 px-4 min-w-[200px]">습관명</th>
                <th className="py-3 px-3 text-center min-w-[80px]">스트릭</th>
                {recentDays.map((d) => (
                  <th key={d.date} className="py-3 px-2.5 text-center min-w-[50px]">
                    <div className="flex flex-col items-center">
                      <span className={d.date === '2026-10-17' ? 'text-indigo-400 font-bold' : ''}>
                        {d.label}
                      </span>
                      <span className="text-[11px] text-neutral-500 font-mono tabular-nums">
                        {d.dayNum}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="py-3 px-3 text-right">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {habits.map((habit) => {
                return (
                  <tr key={habit.id} className="hover:bg-neutral-800/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-200">
                          {habit.title}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          · {categoryKorean[habit.category]}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 tabular-nums">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        <span>{habit.streak}일</span>
                      </div>
                    </td>

                    {/* 7 Days check circles */}
                    {recentDays.map((d) => {
                      const isChecked = !!habit.history[d.date];
                      const isToday = d.date === '2026-10-17';
                      return (
                        <td key={d.date} className="py-3.5 px-2.5 text-center">
                          <button
                            onClick={() => onToggleHabitDay(habit.id, d.date)}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                              isChecked
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : isToday
                                ? 'bg-neutral-800 border border-indigo-500/50 text-neutral-500 hover:text-white hover:border-indigo-400'
                                : 'bg-neutral-900 border border-neutral-800 text-transparent hover:text-neutral-500'
                            }`}
                          >
                            <Check className={`w-4 h-4 ${isChecked ? 'opacity-100' : 'opacity-0 hover:opacity-50'}`} />
                          </button>
                        </td>
                      );
                    })}

                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => onDeleteHabit(habit.id)}
                        className="text-neutral-600 hover:text-rose-400 transition-colors p-1"
                        title="습관 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">새로운 습관 루틴 만들기</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  습관 이름
                </label>
                <input
                  type="text"
                  placeholder="예: 매일 물 1L 마시기, 30분 코딩..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  카테고리
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['health', 'study', 'work', 'personal'] as TaskCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        newCategory === cat
                          ? 'bg-neutral-800 border-indigo-500 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {categoryKorean[cat]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  주간 목표 빈도: {targetDays}일 / 주
                </label>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={targetDays}
                  onChange={(e) => setTargetDays(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  습관 생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Habit Coach Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Gemini AI 루틴 코치</h3>
            </div>
            <p className="text-xs text-neutral-400">
              달성하고 싶은 목표를 적어주시면, 매일 15분 이내로 부담 없이 지속할 수 있는 마이크로 습관을 설계해드립니다.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="예: 영어 스피킹 실력 키우기, 뱃살 줄이기..."
                value={aiGoalInput}
                onChange={(e) => setAiGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAiCoach()}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAskAiCoach}
                disabled={aiLoading || !aiGoalInput.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
              >
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>추천받기</span>
              </button>
            </div>

            {aiSuggestions && (
              <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 text-xs text-neutral-200 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                {aiSuggestions}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAiModal(false);
                  setAiSuggestions('');
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
