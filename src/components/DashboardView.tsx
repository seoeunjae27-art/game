import React, { useState } from 'react';
import { Task, Habit } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Flame, 
  Target, 
  Play, 
  Pause, 
  Volume2, 
  Sparkles, 
  ArrowRight, 
  Plus, 
  VolumeX,
  Loader2
} from 'lucide-react';
import { soundSynthesizer } from '../utils/soundSynthesizer';

interface DashboardViewProps {
  tasks: Task[];
  habits: Habit[];
  onToggleTask: (id: string) => void;
  onToggleHabitToday: (id: string) => void;
  onNavigate: (tab: string) => void;
  onQuickAddTask: (title: string) => void;
  todayFocusMinutes: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  habits,
  onToggleTask,
  onToggleHabitToday,
  onNavigate,
  onQuickAddTask,
  todayFocusMinutes,
}) => {
  const [oneGoal, setOneGoal] = useState<string>(() => {
    return localStorage.getItem('flowspace_one_goal') || '주요 마일스톤 완료 및 50분 딥워크 2회 달성하기';
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');

  // Mini timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [rainPlaying, setRainPlaying] = useState(false);

  // AI tip state
  const [aiTip, setAiTip] = useState(
    '가장 중요한 단 하나의 작업(One Big Goal)에 첫 90분의 에너지를 투자하세요. 방해 요소를 차단하면 작업 속도가 2배 빨라집니다.'
  );
  const [loadingAiTip, setLoadingAiTip] = useState(false);

  // Stats calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activeStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

  // Mini timer interval
  React.useEffect(() => {
    let interval: any = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerRunning) {
      setTimerRunning(false);
      soundSynthesizer.playChime();
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  const toggleMiniTimer = () => {
    setTimerRunning(!timerRunning);
  };

  const toggleRainSound = () => {
    const nextState = !rainPlaying;
    setRainPlaying(nextState);
    soundSynthesizer.setSound('rain', nextState, 0.5);
  };

  const handleGoalSave = () => {
    localStorage.setItem('flowspace_one_goal', oneGoal);
    setIsEditingGoal(false);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickAddTask(quickTitle.trim());
    setQuickTitle('');
  };

  const fetchAiInspiration = async () => {
    setLoadingAiTip(true);
    try {
      const res = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'general',
          text: '오늘 하루의 몰입과 번아웃 방지를 위한 실천적인 생산성 팁을 2문장으로 한국어로 작성해줘.',
        }),
      });
      const data = await res.json();
      if (data.result) {
        setAiTip(data.result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAiTip(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const todayStr = '2026-10-17';

  return (
    <div className="space-y-6">
      {/* Top Welcome & One Goal banner */}
      <section className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span>오늘의 날짜</span>
              <span aria-hidden="true">·</span>
              <span className="text-neutral-300 font-medium">2026년 10월 17일 토요일</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              반갑습니다! 오늘을 가치 있게 만들어 볼까요?
            </h1>
          </div>

          {/* Today's One Goal Card */}
          <div className="w-full md:w-auto md:min-w-[360px] bg-neutral-950/80 border border-neutral-800/90 rounded-xl p-3.5 flex items-start gap-3">
            <Target className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block mb-0.5">
                오늘의 핵심 목표 (One Goal)
              </span>
              {isEditingGoal ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={oneGoal}
                    onChange={(e) => setOneGoal(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 text-sm rounded px-2.5 py-1 text-white focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <button
                    onClick={handleGoalSave}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded transition-colors"
                  >
                    저장
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingGoal(true)}
                  className="text-sm font-medium text-neutral-200 cursor-pointer hover:text-white transition-colors truncate"
                  title="클릭하여 수정"
                >
                  {oneGoal}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4-KPI Metric Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-1.5">
            <span>할 일 완료율</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {taskCompletionRate}%
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {completedTasks}/{totalTasks}개 완료됨
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-1.5">
            <span>오늘의 몰입 시간</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {todayFocusMinutes}분
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            목표 120분 중 {Math.round((todayFocusMinutes / 120) * 100)}% 달성
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-1.5">
            <span>최장 습관 스트릭</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {activeStreak}일 연속
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            매일 꾸준한 루틴 실천 중
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-1.5">
            <span>남은 대기 작업</span>
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {totalTasks - completedTasks}개
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            우선순위 순서로 집중
          </div>
        </div>
      </section>

      {/* Main Two Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Task priorities & Habits summary */}
        <div className="lg:col-span-7 space-y-6">
          {/* Priority Tasks Card */}
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-white">오늘의 우선순위 작업</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  오늘 집중해야 할 주요 항목들을 빠르게 처리하세요.
                </p>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <span>전체 보드</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Add Bar */}
            <form onSubmit={handleQuickAdd} className="flex items-center gap-2 mb-4">
              <input
                type="text"
                placeholder="새 작업 빠르게 추가... (Enter)"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="flex-1 bg-neutral-950 border border-neutral-800 text-xs sm:text-sm text-white rounded-lg px-3.5 py-2 focus:outline-none focus:border-indigo-500 placeholder:text-neutral-500"
              />
              <button
                type="submit"
                disabled={!quickTitle.trim()}
                className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>추가</span>
              </button>
            </form>

            {/* Tasks list */}
            <div className="space-y-2">
              {tasks.slice(0, 5).map((task) => {
                const isDone = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isDone
                        ? 'bg-neutral-950/40 border-neutral-900/60 opacity-60'
                        : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => onToggleTask(task.id)}
                        className="text-neutral-400 hover:text-indigo-400 transition-colors shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-neutral-500 hover:text-neutral-300" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <span
                          className={`text-sm block truncate ${
                            isDone ? 'line-through text-neutral-500' : 'text-neutral-200'
                          }`}
                        >
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                          <span>{task.category === 'work' ? '업무' : task.category === 'study' ? '학습' : task.category === 'health' ? '건강' : '개인'}</span>
                          <span aria-hidden="true">·</span>
                          <span>마감 {task.dueDate}</span>
                          {task.subtasks.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>
                                하위 {task.subtasks.filter((s) => s.completed).length}/
                                {task.subtasks.length}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          task.priority === 'high'
                            ? 'text-rose-400 bg-rose-950/30 border border-rose-900/40'
                            : task.priority === 'medium'
                            ? 'text-amber-400 bg-amber-950/30 border border-amber-900/40'
                            : 'text-neutral-400 bg-neutral-800 border border-neutral-700/50'
                        }`}
                      >
                        {task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Habits Strip */}
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-white">오늘의 루틴 체크</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  작은 습관의 반복이 큰 성장을 만듭니다.
                </p>
              </div>
              <button
                onClick={() => onNavigate('habits')}
                className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <span>전체 트래커</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {habits.map((habit) => {
                const isChecked = !!habit.history[todayStr];
                return (
                  <button
                    key={habit.id}
                    onClick={() => onToggleHabitToday(habit.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isChecked
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                        : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isChecked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-neutral-500 shrink-0" />
                      )}
                      <span className="text-xs sm:text-sm font-medium truncate">{habit.title}</span>
                    </div>
                    <span className="text-xs text-neutral-500 shrink-0 ml-2 tabular-nums">
                      {habit.streak}일 연속
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 5 cols: Mini Focus Timer, AI Insight, Ambient inspiration */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Focus Widget */}
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                퀵 뽀모도로 포커스
              </span>
              <button
                onClick={() => onNavigate('focus')}
                className="text-xs text-neutral-400 hover:text-white transition-colors"
              >
                포커스 룸 열기 →
              </button>
            </div>

            <div className="flex items-center justify-between my-2">
              <div className="text-4xl sm:text-5xl font-mono font-bold text-white tabular-nums">
                {formatTimer(timeLeft)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleRainSound}
                  className={`p-2.5 rounded-xl border transition-all ${
                    rainPlaying
                      ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                  }`}
                  title={rainPlaying ? '빗소리 끄기' : '집중 빗소리 켜기'}
                >
                  {rainPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleMiniTimer}
                  className={`p-3 rounded-xl font-medium flex items-center justify-center transition-all ${
                    timerRunning
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              25분 타이머 작동 중에는 잡념을 메모장에 적어두고 오직 현재 작업에만 집중하세요.
            </p>
          </div>

          {/* AI Productivity Copilot Tip */}
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>오늘의 Gemini 생산성 인사이트</span>
              </div>
              <button
                onClick={fetchAiInspiration}
                disabled={loadingAiTip}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {loadingAiTip ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                <span>새로운 조언</span>
              </button>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed italic">
              "{aiTip}"
            </p>
          </div>

          {/* Ambient Inspiration Visual Card */}
          <div className="relative rounded-2xl overflow-hidden border border-neutral-800 shadow-sm aspect-video">
            <img
              src="/src/assets/images/focus_ambient_cover_1792229302168.jpg"
              alt="집중을 위한 데스크 앰비언스"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 flex flex-col justify-end">
              <span className="text-xs font-semibold text-neutral-300">
                몰입 환경 디자인
              </span>
              <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                완벽한 몰입은 조용한 공간과 정리된 데스크에서 시작됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
