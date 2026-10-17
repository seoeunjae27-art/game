import React, { useState } from 'react';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '../types';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Sparkles, 
  Kanban, 
  List, 
  Calendar, 
  Loader2,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface TasksViewProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onUpdateTaskSubtasks: (taskId: string, newSubtasks: { id: string; title: string; completed: boolean }[]) => void;
  onOpenNewTaskModal: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onUpdateTaskStatus,
  onDeleteTask,
  onToggleSubtask,
  onAddSubtask,
  onUpdateTaskSubtasks,
  onOpenNewTaskModal,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<Record<string, string>>({});
  const [aiLoadingTasks, setAiLoadingTasks] = useState<Record<string, boolean>>({});

  const toggleTaskExpanded = (id: string) => {
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubtaskAddSubmit = (taskId: string) => {
    const title = (newSubtaskInputs[taskId] || '').trim();
    if (!title) return;
    onAddSubtask(taskId, title);
    setNewSubtaskInputs((prev) => ({ ...prev, [taskId]: '' }));
  };

  const handleAiBreakdown = async (task: Task) => {
    setAiLoadingTasks((prev) => ({ ...prev, [task.id]: true }));
    try {
      const res = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'breakdown_task',
          text: task.title,
          context: task.description || '',
        }),
      });
      const data = await res.json();
      if (data.result) {
        // Parse markdown checklist lines
        const lines = data.result.split('\n');
        const parsedSubtasks: { id: string; title: string; completed: boolean }[] = [];
        lines.forEach((line: string) => {
          const cleaned = line.replace(/^[-*]\s*(\[[ xX]\])?\s*/, '').replace(/^\d+\.\s*/, '').trim();
          if (cleaned.length > 0) {
            parsedSubtasks.push({
              id: 'st-' + Math.random().toString(36).substring(2, 9),
              title: cleaned,
              completed: false,
            });
          }
        });

        if (parsedSubtasks.length > 0) {
          onUpdateTaskSubtasks(task.id, [...task.subtasks, ...parsedSubtasks]);
          setExpandedTasks((prev) => ({ ...prev, [task.id]: true }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoadingTasks((prev) => ({ ...prev, [task.id]: false }));
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', label: '전체' },
    { id: 'work', label: '업무' },
    { id: 'study', label: '학습' },
    { id: 'personal', label: '개인' },
    { id: 'health', label: '건강' },
  ];

  const columns: { id: TaskStatus; label: string }[] = [
    { id: 'todo', label: '대기 (To Do)' },
    { id: 'in_progress', label: '진행 중 (In Progress)' },
    { id: 'completed', label: '완료 (Done)' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/70 border border-neutral-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  selectedCategory === c.id
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'kanban' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="칸반 보드 뷰"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="리스트 뷰"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & New Task */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="작업 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 text-xs sm:text-sm text-white rounded-lg pl-9 pr-3.5 py-1.5 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
            />
          </div>
          <button
            onClick={onOpenNewTaskModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>새 작업 등록</span>
          </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>{col.label}</span>
                    <span className="text-xs text-neutral-500 font-mono tabular-nums bg-neutral-800 px-2 py-0.5 rounded">
                      {colTasks.length}
                    </span>
                  </h3>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-xs text-neutral-500 border border-dashed border-neutral-800/80 rounded-xl">
                      항목이 없습니다
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isExpanded={!!expandedTasks[task.id]}
                        onToggleExpanded={() => toggleTaskExpanded(task.id)}
                        onUpdateStatus={onUpdateTaskStatus}
                        onDelete={onDeleteTask}
                        onToggleSubtask={onToggleSubtask}
                        onAiBreakdown={() => handleAiBreakdown(task)}
                        isAiLoading={!!aiLoadingTasks[task.id]}
                        newSubtaskVal={newSubtaskInputs[task.id] || ''}
                        onNewSubtaskChange={(val) =>
                          setNewSubtaskInputs((prev) => ({ ...prev, [task.id]: val }))
                        }
                        onAddSubtaskSubmit={() => handleSubtaskAddSubmit(task.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-500">
              일치하는 작업이 없습니다.
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isExpanded={!!expandedTasks[task.id]}
                onToggleExpanded={() => toggleTaskExpanded(task.id)}
                onUpdateStatus={onUpdateTaskStatus}
                onDelete={onDeleteTask}
                onToggleSubtask={onToggleSubtask}
                onAiBreakdown={() => handleAiBreakdown(task)}
                isAiLoading={!!aiLoadingTasks[task.id]}
                newSubtaskVal={newSubtaskInputs[task.id] || ''}
                onNewSubtaskChange={(val) =>
                  setNewSubtaskInputs((prev) => ({ ...prev, [task.id]: val }))
                }
                onAddSubtaskSubmit={() => handleSubtaskAddSubmit(task.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Task Card Subcomponent
interface TaskCardProps {
  task: Task;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAiBreakdown: () => void;
  isAiLoading: boolean;
  newSubtaskVal: string;
  onNewSubtaskChange: (val: string) => void;
  onAddSubtaskSubmit: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isExpanded,
  onToggleExpanded,
  onUpdateStatus,
  onDelete,
  onToggleSubtask,
  onAiBreakdown,
  isAiLoading,
  newSubtaskVal,
  onNewSubtaskChange,
  onAddSubtaskSubmit,
}) => {
  const categoryKorean: Record<TaskCategory, string> = {
    work: '업무',
    study: '학습',
    personal: '개인',
    health: '건강',
  };

  const priorityKorean: Record<TaskPriority, string> = {
    high: '높음',
    medium: '보통',
    low: '낮음',
  };

  const completedSubtasksCount = task.subtasks.filter((s) => s.completed).length;

  return (
    <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3.5 hover:border-neutral-700 transition-all shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 text-xs text-neutral-400">
            <span className="font-medium text-neutral-300">
              {categoryKorean[task.category]}
            </span>
            <span aria-hidden="true">·</span>
            <span
              className={`font-semibold ${
                task.priority === 'high'
                  ? 'text-rose-400'
                  : task.priority === 'medium'
                  ? 'text-amber-400'
                  : 'text-neutral-400'
              }`}
            >
              {priorityKorean[task.priority]}
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-neutral-500" />
              <span>{task.dueDate}</span>
            </span>
          </div>

          <h4
            className={`text-sm font-medium ${
              task.status === 'completed'
                ? 'line-through text-neutral-500'
                : 'text-neutral-100'
            }`}
          >
            {task.title}
          </h4>

          {task.description && (
            <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>

        <button
          onClick={() => onDelete(task.id)}
          className="text-neutral-600 hover:text-rose-400 p-1 transition-colors"
          title="작업 삭제"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtasks Progress Bar & Toggle */}
      <div className="mt-3 pt-2.5 border-t border-neutral-900 flex items-center justify-between text-xs text-neutral-400">
        <button
          onClick={onToggleExpanded}
          className="flex items-center gap-1 hover:text-neutral-200 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
          )}
          <span>
            하위 작업 ({completedSubtasksCount}/{task.subtasks.length})
          </span>
        </button>

        {/* Status mover dropdown */}
        <select
          value={task.status}
          onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
          className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 rounded px-2 py-0.5 focus:outline-none"
        >
          <option value="todo">대기</option>
          <option value="in_progress">진행 중</option>
          <option value="completed">완료</option>
        </select>
      </div>

      {/* Expanded Subtasks & AI Decomposition Section */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-neutral-900 space-y-2.5">
          <div className="space-y-1.5">
            {task.subtasks.map((st) => (
              <div
                key={st.id}
                onClick={() => onToggleSubtask(task.id, st.id)}
                className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer hover:text-white"
              >
                {st.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                )}
                <span className={st.completed ? 'line-through text-neutral-500' : ''}>
                  {st.title}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Subtask Input */}
          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              placeholder="하위 작업 추가..."
              value={newSubtaskVal}
              onChange={(e) => onNewSubtaskChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddSubtaskSubmit();
                }
              }}
              className="flex-1 bg-neutral-900 border border-neutral-800 text-xs rounded px-2.5 py-1 text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={onAddSubtaskSubmit}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs text-white rounded transition-colors"
            >
              추가
            </button>
          </div>

          {/* AI Task Breakdown Action */}
          <button
            onClick={onAiBreakdown}
            disabled={isAiLoading}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-800/40 text-indigo-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isAiLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>Gemini AI로 세부 실행 단계 자동 분해</span>
          </button>
        </div>
      )}
    </div>
  );
};
